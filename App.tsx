import React, { useState, useRef } from 'react';
import ThreeViewer, { ThreeViewerRef } from './components/ThreeViewer';
import DesignControls from './components/DesignControls';
import { generateTShirtDesign, generateCreativePrompt, enhancePrompt } from './services/geminiService';
import { DesignState, Theme, ShirtSize, SleeveLength, FabricType, DEFAULT_SHIRT_COLOR } from './types';
import { Shirt } from 'lucide-react';

function App() {
  const [designState, setDesignState] = useState<DesignState>({
    theme: Theme.CYBERPUNK,
    prompt: '',
    generatedImageBase64: null,
    uploadedImage: false,
    isGenerating: false,
    shirtColor: DEFAULT_SHIRT_COLOR,
    size: ShirtSize.L,
    sleeveLength: SleeveLength.SHORT,
    fabric: FabricType.COTTON,
    quantity: 1
  });

  const [error, setError] = useState<string | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const threeViewerRef = useRef<ThreeViewerRef>(null);

  const updateState = (updates: Partial<DesignState>) => {
    setDesignState(prev => ({ ...prev, ...updates }));
    if (error) setError(null);
  };

  const handleAutoDescription = async () => {
    setIsGeneratingDescription(true);
    setError(null);
    try {
      const creativePrompt = await generateCreativePrompt(designState.theme);
      updateState({ prompt: creativePrompt });
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate description via AI.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!designState.prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const enhanced = await enhancePrompt(designState.prompt, designState.theme);
      updateState({ prompt: enhanced });
    } catch (err: any) {
      console.error(err);
      setError("Failed to enhance prompt.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerateArt = async () => {
    if (!designState.prompt) return;
    updateState({ isGenerating: true });
    setError(null);
    try {
      const imageBase64 = await generateTShirtDesign(designState.theme, designState.prompt, designState.shirtColor);
      updateState({ generatedImageBase64: imageBase64, uploadedImage: false, isGenerating: false });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate design. Please try again.");
      updateState({ isGenerating: false });
    }
  };

  const handleUploadImage = (imageData: string | null) => {
    if (imageData) {
      updateState({ generatedImageBase64: imageData, uploadedImage: true });
    } else {
      updateState({ generatedImageBase64: null, uploadedImage: false });
    }
  };

  const handleDownload = () => {
    if (threeViewerRef.current) {
      const dataUrl = threeViewerRef.current.captureScreenshot();
      if (dataUrl) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `creatorlab-${designState.theme.toLowerCase()}-design.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <img src="/logo.png" alt="Aiorra Logo" className="logo-image" />
            <span className="logo-text">CreatorLab</span>
          </div>
          <a href="https://aiorra.com" className="back-btn" target="_blank" rel="noopener noreferrer">
            ← Back to Aiorra
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-grid">
        {/* Left: 3D Viewer */}
        <div className="viewer-card">
          <div className="viewer-wrapper">
            <ThreeViewer
              ref={threeViewerRef}
              shirtColor={designState.shirtColor}
              designTexture={designState.generatedImageBase64}
              sleeveLength={designState.sleeveLength}
              fabricType={designState.fabric}
            />
            <div className="viewer-hint">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <span>Drag to rotate • Scroll to zoom</span>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <DesignControls
          state={designState}
          updateState={updateState}
          onGenerateArt={handleGenerateArt}
          onGenerateDescription={handleAutoDescription}
          onEnhancePrompt={handleEnhancePrompt}
          onDownload={handleDownload}
          onUploadImage={handleUploadImage}
          isGeneratingDescription={isGeneratingDescription}
          isEnhancing={isEnhancing}
          error={error}
        />
      </main>
    </div>
  );
}

export default App;