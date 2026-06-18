export interface ClipboardClip {
  id: string;
  text: string;
  timestamp: number;
}

export type FontStyle = 'serif' | 'sans' | 'mono';

export type TextSize = 'sm' | 'md' | 'lg' | 'xl' | 'custom';

export interface ReaderSettings {
  fontSize: number; // in pixels
  fontStyle: FontStyle;
  lineHeight: 'normal' | 'relaxed' | 'loose';
  isListening: boolean;
  intervalMs: number;
  theme: 'light' | 'dark';
}
