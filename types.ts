export interface FilterState {
  brightness: number; // 0-200, default 100
  contrast: number; // 0-200, default 100
  saturation: number; // 0-200, default 100
  grayscale: number; // 0-100, default 0
  sepia: number; // 0-100, default 0
  blur: number; // 0-20, default 0
}

export const DEFAULT_FILTERS: FilterState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  blur: 0,
};

export enum EditorMode {
  ADJUST = 'ADJUST',
  CROP = 'CROP', 
  ERASE = 'ERASE',
  AI = 'AI',
}

export interface AIRequestParams {
  image: string; // base64
  prompt: string;
}

export interface CropRatio {
  label: string;
  width: number;
  height: number;
}

export interface HistoryItem {
  image: string;
  timestamp: number;
}
