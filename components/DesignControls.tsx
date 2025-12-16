import React from 'react';
import { Theme, DesignState, ShirtSize, SleeveLength, FabricType } from '../types';
import { Wand2, Loader2, ShoppingCart, Sparkles, BrainCircuit, Scissors, Layers, Download, Truck, Shield, Star, AlertCircle } from 'lucide-react';

interface DesignControlsProps {
    state: DesignState;
    updateState: (updates: Partial<DesignState>) => void;
    onGenerateArt: () => void;
    onGenerateDescription: () => void;
    onEnhancePrompt: () => void;
    onDownload: () => void;
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
    isGeneratingDescription,
    isEnhancing,
    error
}) => {

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