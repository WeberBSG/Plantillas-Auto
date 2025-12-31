
export type ElementType = 'text' | 'photo';

export interface Styling {
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  semibold: boolean;
  italic: boolean;
  letterSpacing: number; // In pixels
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  name?: string; // User-defined name for the layer
  content: string; // text content or base64 image data
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // pixels
  height: number; // pixels
  rotation: number; // degrees
  styling: Styling;
  zIndex: number;
  isLocked: boolean;
  isExpanded?: boolean; // Persisted UI state for sidebar
  opacity: number; // 0 to 1
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'color-burn' | 'linear-burn' | 'darken' | 'lighten';
  showRandomGenerator?: boolean;
  keepAspectRatio?: boolean;
  aspectRatio?: number; // width / height
  borderRadius?: number; // In pixels
}

export interface Template {
  id: string;
  name: string;
  baseImage: string; // base64 image data
  elements: CanvasElement[];
  lastModified: number;
  // Background/Base Photo Styling Properties
  baseOpacity?: number;
  baseRotation?: number;
  baseBlendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'color-burn' | 'linear-burn' | 'darken' | 'lighten';
  baseIsExpanded?: boolean;
  baseBorderRadius?: number; // In pixels
}
