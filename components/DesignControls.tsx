import React, { useRef } from 'react';
import { Theme, DesignState, ShirtSize, SleeveLength, FabricType } from '../types';
import { Wand2, Loader2, ShoppingCart, Sparkles, BrainCircuit, Scissors, Layers, Download, Truck, Shield, Star, AlertCircle, Upload, X, Image } from 'lucide-react';
import { usePixabaySearch, PixabayImage } from '../services/pixabayService';

interface DesignControlsProps {
    state: DesignState;
    updateState: (updates: Partial<DesignState>) => void;
    onGenerateArt: () => void;
    onGenerateDescription: () => void;
    onEnhancePrompt: () => void;
    onDownload: () => void;
    onUploadImage: (imageData: string | null) => void;
    isGeneratingDescription: boolean;
    isEnhancing: boolean;
    error?: string | null;
}

const SHIRT_COLORS = [
    { hex: '#000000', name: 'Black' },
    { hex: '#ffffff', name: 'White' },
    { hex: '#1e293b', name: 'Navy' },
    { hex: '#ef4444', name: 'Red' },
    { hex: '#3b82f6', name: 'Blue' },
    { hex: '#22c55e', name: 'Green' },
    { hex: '#a855f7', name: 'Purple' },
    { hex: '#f59e0b', name: 'Orange' },
];

const DesignControls: React.FC<DesignControlsProps> = ({
    state,
    updateState,
    onGenerateArt,
    onGenerateDescription,
    onEnhancePrompt,
    onDownload,
    onUploadImage,
    isGeneratingDescription,
    isEnhancing,
    error
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Pixabay image suggestions
    const { images: pixabaySuggestions, isLoading: isPixabayLoading } = usePixabaySearch(state.prompt);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                onUploadImage(result);
            };
            reader.readAsDataURL(file);
        }
        // Reset input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveUpload = () => {
        onUploadImage(null);
    };

    const handlePixabayImageSelect = async (image: PixabayImage) => {
        try {
            const response = await fetch(image.webformatURL);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                onUploadImage(result);
            };
            reader.readAsDataURL(blob);
        } catch (err) {
            console.error('Failed to load Pixabay image:', err);
        }
    };

    return (
        <div className="controls-panel">
            {/* Header */}
            <div className="controls-header">
                <h1 className="product-title">Custom AI T-Shirt</h1>
                <div className="product-rating">
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                    </div>
                    <span>4.9 (2,847 reviews)</span>
                </div>
            </div>

            {/* Body */}
            <div className="controls-body">
                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* 1. Theme Selection */}
                <div className="section">
                    <label className="section-label">Style Theme</label>
                    <div className="theme-grid">
                        {Object.values(Theme).map((theme) => (
                            <button
                                key={theme}
                                onClick={() => updateState({ theme })}
                                className={`theme-pill ${state.theme === theme ? 'active' : ''}`}
                            >
                                {theme}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Prompt Input */}
                <div className="section">
                    <label className="section-label">Design Description</label>
                    <div className="ai-buttons">
                        <button
                            onClick={onEnhancePrompt}
                            disabled={isEnhancing || !state.prompt.trim()}
                            className="ai-btn enhance"
                        >
                            {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            Enhance
                        </button>
                        <button
                            onClick={onGenerateDescription}
                            disabled={isGeneratingDescription}
                            className="ai-btn idea"
                        >
                            {isGeneratingDescription ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                            {isGeneratingDescription ? 'Thinking...' : 'Random Idea'}
                        </button>
                    </div>
                    <div className="input-group">
                        <textarea
                            value={state.prompt}
                            onChange={(e) => updateState({ prompt: e.target.value })}
                            placeholder={`Describe your ${state.theme} design... e.g., "A majestic wolf howling at a neon moon"`}
                            className="text-input"
                            rows={3}
                        />
                    </div>

                    {/* Pixabay Image Suggestions */}
                    {state.prompt.trim().length >= 3 && (
                        <div className="pexels-suggestions">
                            <div className="pexels-header">
                                <Image className="w-4 h-4" />
                                <span>Image Suggestions</span>
                                {isPixabayLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            </div>
                            {pixabaySuggestions.length > 0 ? (
                                <div className="pexels-grid">
                                    {pixabaySuggestions.map((image) => (
                                        <button
                                            key={image.id}
                                            onClick={() => handlePixabayImageSelect(image)}
                                            className="pexels-image-btn"
                                            title={`Photo by ${image.user} - Click to use`}
                                        >
                                            <img src={image.previewURL} alt={image.tags || 'Pixabay photo'} />
                                        </button>
                                    ))}
                                </div>
                            ) : !isPixabayLoading && (
                                <p className="pexels-empty">No images found. Try a different description.</p>
                            )}
                            <p className="pexels-credit">
                                Photos provided by <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer">Pixabay</a>
                            </p>
                        </div>
                    )}
                    <div style={{ marginTop: '12px' }}>
                        <button
                            onClick={onGenerateArt}
                            disabled={state.isGenerating || !state.prompt.trim()}
                            className="btn-primary"
                        >
                            {state.isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5" />
                                    Generate Design
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Upload Your Own Image */}
                <div className="section">
                    <label className="section-label">Or Upload Your Own Image</label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="upload-image-input"
                    />
                    {state.generatedImageBase64 && state.uploadedImage ? (
                        <div className="upload-preview">
                            <img
                                src={state.generatedImageBase64}
                                alt="Uploaded design"
                                className="upload-preview-image"
                            />
                            <button
                                onClick={handleRemoveUpload}
                                className="upload-remove-btn"
                                title="Remove uploaded image"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="upload-btn"
                        >
                            <Upload className="w-5 h-5" />
                            Upload Image
                        </button>
                    )}
                    <p className="upload-hint">PNG, JPG or WebP • Best results with transparent background</p>
                </div>

                {/* 3. Product Options */}
                <div className="section">
                    <div className="option-grid">
                        <div className="option-group">
                            <label><Scissors className="w-4 h-4" /> Sleeve</label>
                            <div className="option-list">
                                {Object.values(SleeveLength).map((length) => (
                                    <button
                                        key={length}
                                        onClick={() => updateState({ sleeveLength: length })}
                                        className={`option-card ${state.sleeveLength === length ? 'active' : ''}`}
                                    >
                                        {length}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="option-group">
                            <label><Layers className="w-4 h-4" /> Material</label>
                            <div className="option-list">
                                {Object.values(FabricType).map((fabric) => (
                                    <button
                                        key={fabric}
                                        onClick={() => updateState({ fabric })}
                                        className={`option-card ${state.fabric === fabric ? 'active' : ''}`}
                                    >
                                        {fabric}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Color Selection */}
                <div className="section">
                    <label className="section-label">Color</label>
                    <div className="color-swatches">
                        {SHIRT_COLORS.map((color) => (
                            <button
                                key={color.hex}
                                onClick={() => updateState({ shirtColor: color.hex })}
                                className={`color-swatch ${state.shirtColor === color.hex ? 'active' : ''}`}
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                            />
                        ))}
                        {/* Custom Color Picker */}
                        <div className="custom-color-picker">
                            <input
                                type="color"
                                value={state.shirtColor}
                                onChange={(e) => updateState({ shirtColor: e.target.value })}
                                className="color-input"
                                title="Pick custom color"
                            />
                            <span className="custom-color-label">Custom</span>
                        </div>
                    </div>
                </div>

                {/* Size Selection */}
                <div className="section">
                    <label className="section-label">Size</label>
                    <div className="size-grid">
                        {Object.values(ShirtSize).map((size) => (
                            <button
                                key={size}
                                onClick={() => updateState({ size })}
                                className={`size-btn ${state.size === size ? 'active' : ''}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer - Pricing & CTA */}
            <div className="controls-footer">
                <div className="price-section">
                    <div>
                        <div className="price-main">$29.99</div>
                        <div className="price-label">Price per shirt</div>
                    </div>
                    <div className="qty-selector">
                        <button
                            onClick={() => updateState({ quantity: Math.max(1, state.quantity - 1) })}
                            className="qty-btn"
                        >
                            −
                        </button>
                        <span className="qty-value">{state.quantity}</span>
                        <button
                            onClick={() => updateState({ quantity: state.quantity + 1 })}
                            className="qty-btn"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="price-shipping">
                    <Truck className="w-4 h-4" />
                    FREE Shipping
                </div>

                <div className="action-buttons">
                    <button onClick={onDownload} className="btn-secondary" title="Download preview">
                        <Download className="w-5 h-5" />
                    </button>
                    <button className="btn-cta">
                        <ShoppingCart className="w-5 h-5" />
                        Add to Cart
                    </button>
                </div>

                <div className="trust-badges">
                    <div className="trust-badge">
                        <Shield />
                        Secure checkout
                    </div>
                    <div className="trust-badge">
                        <Star />
                        Premium quality
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignControls;