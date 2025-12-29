export enum ConversionMode {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO'
}

export interface ConversionResult {
  type: 'text' | 'image' | 'audio' | 'file';
  data: string; // Text content or Base64/Blob URL
  label: string;
  mimeType?: string;
  filename?: string;
}

export type TextAlgorithm = 'BINARY' | 'DUODECIMAL' | 'MORSE' | 'BASE64' | 'HEX' | 'REVERSE';
export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/x-icon';
export type AudioFormat = 'audio/wav';

export interface LogMessage {
  id: string;
  type: 'info' | 'success' | 'error';
  text: string;
}
