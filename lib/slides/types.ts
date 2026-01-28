/**
 * Artwork Slides - Reels-style slide editor types
 * 
 * Mobile-first, Instagram-style free canvas where artists can
 * drag, pinch, resize, and rotate elements.
 */

// ============================================
// Background Types
// ============================================

export type BackgroundType = 'image' | 'video' | 'gradient' | 'solid';

export type GradientPreset = 
  | 'dark'          // Black to dark gray
  | 'warm'          // Orange to red
  | 'cool'          // Blue to purple
  | 'nature'        // Green to teal
  | 'sunset'        // Pink to orange
  | 'midnight';     // Deep blue to black

export interface SlideBackground {
  type: BackgroundType;
  url?: string;           // For image/video
  value?: string;         // For gradient preset name or hex color
  
  // Zoom/pan within frame
  scale: number;          // 1.0 = fit, 1.5 = 150% zoom
  offsetX: number;        // % offset from center (-50 to 50)
  offsetY: number;        // % offset from center (-50 to 50)
}

// ============================================
// Canvas Element Types
// ============================================

export type ElementType = 'text' | 'image';

export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type FontWeight = 'normal' | 'bold';
export type FontStyle = 'normal' | 'italic';
export type TextAlign = 'left' | 'center' | 'right';

export interface TextStyle {
  fontSize: FontSize;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  color: string;              // hex color
  backgroundColor?: string;   // bubble background (optional)
  textAlign: TextAlign;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  
  // Position (% from top-left of canvas)
  x: number;              // 0-100
  y: number;              // 0-100
  
  // Transform
  scale: number;          // 1.0 = original size
  rotation: number;       // degrees, 0-360
  
  // Dimensions (% of canvas for hit detection)
  width: number;
  height: number;
  
  // Content
  content: string;        // text string or image URL
  
  // Style (for text elements)
  style?: TextStyle;
}

// ============================================
// Audio Types
// ============================================

export type AudioType = 'spotify' | 'uploaded' | 'voice_note';

export interface SlideAudio {
  type: AudioType;
  url: string;
  title?: string;
  artist?: string;        // For Spotify tracks
}

// ============================================
// Slide Types
// ============================================

export interface Slide {
  id: string;
  product_id: string;
  display_order: number;
  
  background: SlideBackground;
  elements: CanvasElement[];
  
  // Title + Caption (suggested via pill bar)
  title?: string;
  caption?: string;
  
  audio?: SlideAudio;
  
  is_locked: boolean;
  is_published: boolean;
  
  created_at: string;
  updated_at: string;
}

// For creating a new slide
export interface CreateSlideInput {
  product_id: string;
  display_order?: number;
  background?: Partial<SlideBackground>;
  elements?: CanvasElement[];
  title?: string;
  caption?: string;
  audio?: SlideAudio;
  is_locked?: boolean;
}

// For updating a slide
export interface UpdateSlideInput {
  background?: SlideBackground;
  elements?: CanvasElement[];
  title?: string | null;
  caption?: string | null;
  audio?: SlideAudio | null;
  is_locked?: boolean;
  is_published?: boolean;
}

// ============================================
// Title Pill Suggestions
// ============================================

export const TITLE_SUGGESTIONS = [
  { id: 'story', label: 'The Story', description: 'The narrative behind the piece' },
  { id: 'process', label: 'Process', description: 'How it was made' },
  { id: 'inspiration', label: 'Inspiration', description: 'What sparked the idea' },
  { id: 'detail', label: 'Detail', description: 'Close-up or hidden element' },
  { id: 'soundtrack', label: 'Soundtrack', description: 'The music for this piece' },
  { id: 'artist-note', label: 'Artist Note', description: 'Personal message to collectors' },
  { id: 'materials', label: 'Materials', description: "What it's made of" },
  { id: 'behind-scenes', label: 'Behind the Scenes', description: 'Studio/workspace shot' },
] as const;

export type TitleSuggestionId = typeof TITLE_SUGGESTIONS[number]['id'];

// ============================================
// Gradient Presets
// ============================================

export const GRADIENT_PRESETS: Record<GradientPreset, { from: string; to: string }> = {
  dark: { from: '#1a1a1a', to: '#0a0a0a' },
  warm: { from: '#f97316', to: '#dc2626' },
  cool: { from: '#3b82f6', to: '#8b5cf6' },
  nature: { from: '#22c55e', to: '#14b8a6' },
  sunset: { from: '#ec4899', to: '#f97316' },
  midnight: { from: '#1e3a5f', to: '#0f172a' },
};

// ============================================
// Default Values
// ============================================

export const DEFAULT_BACKGROUND: SlideBackground = {
  type: 'gradient',
  value: 'dark',
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 'large',
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#ffffff',
  textAlign: 'center',
};

export function createDefaultSlide(productId: string, order: number): CreateSlideInput {
  return {
    product_id: productId,
    display_order: order,
    background: DEFAULT_BACKGROUND,
    elements: [],
  };
}

export function createTextElement(
  content: string,
  x: number = 50,
  y: number = 50,
  style?: Partial<TextStyle>
): CanvasElement {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    x,
    y,
    scale: 1,
    rotation: 0,
    width: 80,
    height: 20,
    content,
    style: { ...DEFAULT_TEXT_STYLE, ...style },
  };
}

export function createImageElement(
  url: string,
  x: number = 50,
  y: number = 50
): CanvasElement {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    x,
    y,
    scale: 1,
    rotation: 0,
    width: 40,
    height: 40,
    content: url,
  };
}
