
import { GoogleGenAI } from "@google/genai";
import { Theme } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Initialize the client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Generates a creative text description for a T-shirt based on the theme.
 * Uses gemini-2.5-flash (text model).
 */
export const generateCreativePrompt = async (theme: Theme): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error("API Key is missing.");
  }

  const model = 'gemini-2.5-flash';

  const prompt = `You are a visionary fashion designer. Write a creative, vivid, and concise description (max 30 words) for a graphic T-shirt design based on the theme: "${theme}". 
  Focus on visual elements, colors, and style. 
  Output ONLY the description. Do not include quotes or intro text.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || '';
  } catch (error: any) {
    console.error("Gemini Text Generation Error:", error);
    throw new Error("Failed to generate description.");
  }
};

/**
 * Enhances an existing user prompt to be more artistic and descriptive.
 */
export const enhancePrompt = async (currentPrompt: string, theme: Theme): Promise<string> => {
  if (!GEMINI_API_KEY) throw new Error("API Key is missing.");

  const model = 'gemini-2.5-flash';
  const instruction = `Act as an expert art director. Rewrite the following T-shirt design prompt to be more descriptive, artistic, and suitable for a high-quality vector illustration in the style of "${theme}". 
  Keep it concise (under 40 words). 
  Maintain the original subject matter but make it sound professional.
  Output ONLY the enhanced prompt text.`;

  try {
    const result = await ai.models.generateContent({
      model,
      contents: `${instruction}\n\nInput Prompt: "${currentPrompt}"`
    });
    return result.text?.trim() || currentPrompt;
  } catch (e) {
    console.error("Enhance Prompt Error:", e);
    return currentPrompt; // Fallback to original
  }
};
/**
 * Helper to convert hex color to a descriptive name for better DALL-E results
 */
const hexToColorName = (hex: string): string => {
  const colorMap: { [key: string]: string } = {
    '#000000': 'pure black',
    '#ffffff': 'pure white',
    '#1e293b': 'dark navy blue',
    '#ef4444': 'bright red',
    '#3b82f6': 'bright blue',
    '#22c55e': 'bright green',
    '#a855f7': 'purple',
    '#f59e0b': 'orange',
  };
  return colorMap[hex.toLowerCase()] || `color ${hex}`;
};

/**
 * Generates the actual image based on the user's prompt and theme.
 * Uses OpenAI DALL-E 3 for image generation.
 */
export const generateTShirtDesign = async (theme: Theme, userPrompt: string, shirtColorHex: string): Promise<string> => {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API Key is missing. Please set the OPENAI_API_KEY environment variable.");
  }

  const colorName = hexToColorName(shirtColorHex);

  // Build the prompt for DALL-E 3 - Generate ONLY the graphic design, not a T-shirt
  const fullPrompt = `Create a standalone graphic artwork design. 
Theme: ${theme}. 
Subject: ${userPrompt}. 
Style: Professional vector illustration, high contrast, clean lines, centered composition, square aspect ratio, high quality, masterpiece.
IMPORTANT: Generate ONLY the graphic/artwork itself - do NOT include any T-shirt, clothing, fabric, or mockup. The design should be an isolated graphic that can be printed on merchandise.
CRITICAL: The background MUST be a solid, flat, uniform ${colorName} color (hex: ${shirtColorHex}). No gradients, no patterns, no textures - just a pure solid ${colorName} background filling the entire image behind the artwork.`;

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: fullPrompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
        quality: 'hd',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`OpenAI API Error: ${errorMessage}`);
    }

    const data = await response.json();

    if (data.data && data.data.length > 0 && data.data[0].b64_json) {
      return `data:image/png;base64,${data.data[0].b64_json}`;
    }

    throw new Error("No image data returned from OpenAI. Please try a different prompt.");

  } catch (error: any) {
    console.error("OpenAI Image Generation Error:", error);
    throw error;
  }
};
