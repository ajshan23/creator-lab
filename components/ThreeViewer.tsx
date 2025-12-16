import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SleeveLength, FabricType } from '../types';

interface ThreeViewerProps {
  shirtColor: string;
  designTexture: string | null;
  sleeveLength: SleeveLength;
  fabricType: FabricType;
}

export interface ThreeViewerRef {
  captureScreenshot: () => string | null;
}

const ThreeViewer = forwardRef<ThreeViewerRef, ThreeViewerProps>(({ shirtColor, designTexture, sleeveLength, fabricType }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const shirtGroupRef = useRef<THREE.Group | null>(null);
  const printMeshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    captureScreenshot: () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        return rendererRef.current.domElement.toDataURL('image/png');
      }
      return null;
    }
  }));

  // Initialize Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Cleanup
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf3f4f6); // Light gray bg

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 0, 4.5); // Closer zoom for the new scale

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true // Required for screenshot
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // CRITICAL: Accurate Colors
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // NoToneMapping ensures Hex colors are rendered literally (mostly)
    renderer.toneMapping = THREE.NoToneMapping;

    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 1.5; // Prevent looking from below

    // 5. Lighting (High-Key for Color Accuracy)
    // Ambient: High intensity to flatten shadows on White/Colors
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Key Light: Frontal
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
    keyLight.position.set(1, 2, 3);
    keyLight.castShadow = true;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Rim/Back Light: Separation
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(0, 2, -3);
    scene.add(backLight);

    // 6. Placeholder Group
    const shirtGroup = new THREE.Group();
    shirtGroupRef.current = shirtGroup;
    scene.add(shirtGroup);

    // Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // --- Rebuild Geometry when Sleeve/Fabric changes ---
  useEffect(() => {
    const group = shirtGroupRef.current;
    if (!group) return;

    // Clear existing
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      // Do not dispose material here if shared, but here we recreate everything
      group.remove(child);
    }

    // Material
    // Adjust material properties for fabric types
    let roughness = 0.9;
    let metalness = 0.0;

    if (fabricType === 'Performance Poly') {
      roughness = 0.5;
      metalness = 0.1;
    } else if (fabricType === 'Silk Blend') {
      roughness = 0.3;
      metalness = 0.2;
    }

    // Base Shirt Material
    const material = new THREE.MeshStandardMaterial({
      color: shirtColor,
      roughness: roughness,
      metalness: metalness,
    });

    // --- 1. TORSO ---
    // Flattened cylinder
    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.5, 32);
    const torso = new THREE.Mesh(torsoGeo, material);
    torso.scale.set(1, 1, 0.5); // Flatten depth
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    // --- 2. NECK (Collar) ---
    const collarGeo = new THREE.TorusGeometry(0.22, 0.04, 16, 32);
    const collar = new THREE.Mesh(collarGeo, material);
    collar.position.set(0, 0.75, 0);
    collar.rotation.x = Math.PI / 2;
    group.add(collar);

    // --- 3. SLEEVES ---
    if (sleeveLength !== 'Sleeveless') {
      const isLong = sleeveLength === 'Long Sleeve';
      const sleeveLen = isLong ? 1.6 : 0.6;
      const sleeveRadTop = 0.22;
      const sleeveRadBot = isLong ? 0.15 : 0.2; // Taper more for long

      // Left Arm
      const armGeo = new THREE.CylinderGeometry(sleeveRadTop, sleeveRadBot, sleeveLen, 32);
      const leftArm = new THREE.Mesh(armGeo, material);

      // Positioning is tricky to look connected.
      // Pivot point should be at shoulder.
      // We move geometry to pivot, then rotate mesh.
      armGeo.translate(0, -sleeveLen / 2, 0); // Pivot at top

      leftArm.position.set(0.5, 0.65, 0); // Shoulder point
      leftArm.rotation.z = Math.PI / 3.5; // Angle down
      leftArm.castShadow = true;
      leftArm.receiveShadow = true;
      group.add(leftArm);

      // Right Arm
      const rightArm = new THREE.Mesh(armGeo, material);
      rightArm.position.set(-0.5, 0.65, 0);
      rightArm.rotation.z = -Math.PI / 3.5;
      rightArm.castShadow = true;
      rightArm.receiveShadow = true;
      group.add(rightArm);
    } else {
      // Sleeveless: Add shoulder caps or just rely on torso
      // Let's add small caps to smooth the cylinder edge
      const capGeo = new THREE.SphereGeometry(0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const leftCap = new THREE.Mesh(capGeo, material);
      leftCap.position.set(0.45, 0.6, 0);
      leftCap.scale.set(1, 0.5, 0.5); // Flatten
      group.add(leftCap);

      const rightCap = new THREE.Mesh(capGeo, material);
      rightCap.position.set(-0.45, 0.6, 0);
      rightCap.scale.set(1, 0.5, 0.5);
      group.add(rightCap);
    }

    // --- 4. PRINT AREA ---
    // Curved plane (Cylinder sector) to match torso curve
    // Radius slightly larger than torso (0.55) -> 0.56
    // Height 0.7
    // ThetaLength: Cover front ~90 degrees. 1.6 radians.
    // Centered at Theta=0 (which corresponds to +Z in CylinderGeometry)
    const printGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.7, 32, 1, true, -0.8, 1.6);

    // Fix UVs to map full texture to this sector
    const posAttribute = printGeo.attributes.position;
    const uvAttribute = printGeo.attributes.uv;

    // Map UVs based on X (width) and Y (height) for correct front projection
    for (let i = 0; i < posAttribute.count; i++) {
      const x = posAttribute.getX(i); // X is horizontal width on front face
      const y = posAttribute.getY(i); // Y is vertical height

      // Map X range.
      // Width of arc is approx 2 * 0.56 * sin(0.8) ~= 0.8
      // We use 0.82 to cover the edges nicely without stretching too much.
      const u = (x / 0.82) + 0.5;
      const v = (y / 0.7) + 0.5;

      uvAttribute.setXY(i, u, v);
    }

    const printMat = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: false, // Prevent occlusion issues with shirt
      polygonOffset: true,
      polygonOffsetFactor: -4, // Pull stronger towards camera
      roughness: roughness,
      metalness: metalness
    });

    const printMesh = new THREE.Mesh(printGeo, printMat);

    // Scale must match Torso (1, 1, 0.5) to hug the flattened shape
    printMesh.scale.set(1, 1, 0.5);

    // Position: Default is centered at (0,0,0).
    // Rotation: Default Cylinder faces +Z. No rotation needed for Front.
    printMesh.rotation.set(0, 0, 0);

    printMeshRef.current = printMesh;
    group.add(printMesh);

    // Initial Texture Apply
    updateTexture(designTexture, printMesh);

  }, [sleeveLength, fabricType]);

  // --- Update Color Helper ---
  useEffect(() => {
    const group = shirtGroupRef.current;
    if (group) {
      group.children.forEach((child: any) => {
        if (child.material && child !== printMeshRef.current) {
          child.material.color.set(shirtColor);
        }
      });
    }
  }, [shirtColor]);

  // --- Update Texture Helper ---
  const updateTexture = (texUrl: string | null, mesh: THREE.Mesh | null) => {
    if (!mesh) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;

    if (texUrl) {
      new THREE.TextureLoader().load(texUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = true;
        mat.map = tex;
        mat.opacity = 1;
        mat.needsUpdate = true;
      });
    } else {
      mat.map = null;
      mat.opacity = 0;
      mat.needsUpdate = true;
    }
  };

  useEffect(() => {
    updateTexture(designTexture, printMeshRef.current);
  }, [designTexture]);

  return <div ref={mountRef} className="w-full h-full min-h-[400px] cursor-move touch-none" />;
});

export default ThreeViewer;