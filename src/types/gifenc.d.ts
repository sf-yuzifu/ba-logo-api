declare module 'gifenc' {
  export interface GIFEncoderOptions {
    initialCapacity?: number;
    auto?: boolean;
  }

  export interface WriteFrameOptions {
    palette?: number[][];
    delay?: number;
    repeat?: number;
    transparent?: boolean;
    transparentIndex?: number;
    colorDepth?: number;
    dispose?: number;
  }

  export interface GIFEncoderInstance {
    reset(): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    buffer(): ArrayBuffer;
    writeHeader(): void;
    writeFrame(
      index: Uint8Array | number[],
      width: number,
      height: number,
      opts?: WriteFrameOptions,
    ): void;
  }

  export function GIFEncoder(opt?: GIFEncoderOptions): GIFEncoderInstance;

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    opts?: {
      format?: string;
      oneBitAlpha?: boolean;
      clearAlpha?: boolean;
      clearAlphaThreshold?: number;
      clearAlphaColor?: number;
    },
  ): number[][];

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: string,
  ): Uint8Array;
}
