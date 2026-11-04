function makeChunk(fourcc: string, payload: Buffer): Buffer {
  const header = Buffer.alloc(8);
  header.write(fourcc, 0, 4, 'ascii');
  header.writeUInt32LE(payload.length, 4);
  const padding = payload.length % 2 === 0 ? Buffer.alloc(0) : Buffer.alloc(1);
  return Buffer.concat([header, payload, padding]);
}

/** 提取静态 WebP 中允许放入 ANMF 帧的图像块，去掉外层 RIFF / VP8X 容器。 */
function extractFrameChunks(webp: Buffer): Buffer[] {
  if (webp.toString('ascii', 0, 4) !== 'RIFF' || webp.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('Invalid WebP frame');
  }
  const chunks: Buffer[] = [];
  let offset = 12;
  while (offset + 8 <= webp.length) {
    const fourcc = webp.toString('ascii', offset, offset + 4);
    const size = webp.readUInt32LE(offset + 4);
    const end = offset + 8 + size + (size % 2);
    if (end > webp.length) throw new Error('Invalid WebP chunk');
    if (fourcc === 'VP8 ' || fourcc === 'VP8L' || fourcc === 'ALPH') {
      chunks.push(webp.subarray(offset, end));
    }
    offset = end;
  }
  if (chunks.length === 0) throw new Error('WebP frame has no image bitstream');
  return chunks;
}

/** 使用 Canvas 同步编码的静态 WebP 帧组装标准动画容器。 */
export function encodeAnimatedWebP(
  frames: readonly Buffer[],
  width: number,
  height: number,
  delays: readonly number[],
): Buffer {
  if (frames.length === 0 || frames.length !== delays.length) {
    throw new Error('Animated WebP requires matching frames and delays');
  }

  const vp8x = Buffer.alloc(10);
  vp8x[0] = 0x12; // Animation + alpha
  vp8x.writeUIntLE(width - 1, 4, 3);
  vp8x.writeUIntLE(height - 1, 7, 3);

  const anim = Buffer.alloc(6);
  anim.writeUInt32LE(0, 0); // 透明背景；每帧均覆盖完整画布
  anim.writeUInt16LE(0, 4); // 无限循环

  const frameChunks = frames.map((frame, index) => {
    const header = Buffer.alloc(16);
    header.writeUIntLE(0, 0, 3); // x / 2
    header.writeUIntLE(0, 3, 3); // y / 2
    header.writeUIntLE(width - 1, 6, 3);
    header.writeUIntLE(height - 1, 9, 3);
    header.writeUIntLE(Math.min(Math.max(Math.round(delays[index]), 0), 0xffffff), 12, 3);
    header[15] = 0; // 完整帧直接替换，不做 alpha 混合或背景清除
    return makeChunk('ANMF', Buffer.concat([header, ...extractFrameChunks(frame)]));
  });

  const body = Buffer.concat([
    Buffer.from('WEBP', 'ascii'),
    makeChunk('VP8X', vp8x),
    makeChunk('ANIM', anim),
    ...frameChunks,
  ]);
  const header = Buffer.alloc(8);
  header.write('RIFF', 0, 4, 'ascii');
  header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}
