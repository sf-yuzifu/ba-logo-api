export type OutputFormat =
  | 'png'
  | 'webp'
  | 'svg'
  | 'jpeg'
  | 'base64'
  | 'gif'
  | 'apng'
  | 'svg-animated'
  | 'webp-animated';

export type SupportedLang = 'zh' | 'zh-tw' | 'en' | 'ja' | 'ko';

export interface LogoFormState {
  left: string;
  right: string;
  subtitle: string;
  subtitleColor: string;
  subX: number;
  subY: number;
  subtitleFontSize: number;
  accent: string;
  textColor: string;
  crossColor: string;
  haloColor: string;
  behind: boolean;
  x: number;
  y: number;
  wordGap: number;
  scale: number;
  format: OutputFormat;
  transparent: boolean;
  dark: boolean;
  swap: boolean;
  padding: string;
  center: boolean;
}

export interface ActivePreview {
  url: string;
  snapshot: Readonly<LogoFormState>;
  blobUrl: string | null;
  blob: Blob | null;
  base64Data: {
    base64: string;
    dataUrl: string;
    width: number;
    height: number;
    mimeType: string;
  } | null;
  width: number | string;
  height: number | string;
  latencyMs: string;
  error: string | null;
}

export interface ColorPreset {
  color: string;
  name: string;
  borderColor?: string;
}
