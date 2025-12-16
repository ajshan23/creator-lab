
export enum Theme {
  CYBERPUNK = 'Cyberpunk',
  ANIME = 'Anime',
  MINIMALIST = 'Minimalist',
  VAPORWAVE = 'Vaporwave',
  RETRO = 'Retro 80s',
  NATURE = 'Nature/Floral',
  ABSTRACT = 'Abstract'
}

export enum ShirtSize {
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL'
}

export enum SleeveLength {
  SLEEVELESS = 'Sleeveless',
  SHORT = 'Short Sleeve',
  LONG = 'Long Sleeve'
}

export enum FabricType {
  COTTON = 'Premium Cotton',
  POLYESTER = 'Performance Poly',
  SILK = 'Silk Blend'
}

export interface DesignState {
  theme: Theme;
  prompt: string;
  generatedImageBase64: string | null;
  uploadedImage: boolean;
  isGenerating: boolean;
  shirtColor: string;
  size: ShirtSize;
  sleeveLength: SleeveLength;
  fabric: FabricType;
  quantity: number;
}

export const DEFAULT_SHIRT_COLOR = '#1e293b'; // Slate 800
