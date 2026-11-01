import type { LogoFormState } from '../types.ts';

function cleanHex(color: string): string {
  return color.replace(/^#/, '').trim();
}

/**
 * 统一构建前端请求或分享的 API 相对/绝对 URL
 * 支持 RESTful `/api/logo` 与旧版 `/balogo` 双重路由参数映射
 */
export function buildLogoUrl(state: Readonly<LogoFormState>, origin = ''): string {
  const params = new URLSearchParams();
  const isLegacy = state.endpoint === 'balogo';

  const defaultTextColor = state.dark ? '#ffffff' : '#2b2b2b';
  const hasCustomTextColor = state.textColor.trim().toLowerCase() !== defaultTextColor;
  const hasCustomAccent = state.accent.trim().toLowerCase() !== '#128afa';

  if (isLegacy) {
    // 兼容旧版 /balogo
    params.set('l', state.left);
    params.set('r', state.right);

    if (state.subtitle) {
      params.set('sub', state.subtitle);
      if (state.subtitleColor) params.set('subColor', cleanHex(state.subtitleColor));
      if (state.subX !== 0) params.set('subX', String(state.subX));
      if (state.subY !== 0) params.set('subY', String(state.subY));
    }

    if (hasCustomAccent) params.set('accent', cleanHex(state.accent));
    if (hasCustomTextColor) params.set('textColor', cleanHex(state.textColor));
    if (state.crossColor) params.set('cross', cleanHex(state.crossColor));
    if (state.haloColor) params.set('halo', cleanHex(state.haloColor));
    if (state.behind) params.set('behind', 'true');

    if (state.x !== -15) params.set('x', String(state.x));
    if (state.y !== 0) params.set('y', String(state.y));
    if (state.wordGap !== 0) params.set('gap', String(state.wordGap));
    if (state.scale !== 1) params.set('scale', String(state.scale));
    if (state.format !== 'png') params.set('format', state.format);
    if (state.transparent) params.set('tp', 'true');
    if (state.dark) params.set('dark', 'true');
    if (state.swap) params.set('swap', 'true');

    const trimmedPadding = state.padding.trim();
    if (trimmedPadding && trimmedPadding !== '2') {
      params.set('padding', trimmedPadding);
    }
    if (state.center !== !state.transparent) {
      params.set('center', String(state.center));
    }

    const query = params.toString();
    return `${origin}/balogo${query ? `?${query}` : ''}`;
  }

  // 现代 RESTful /api/logo
  params.set('left', state.left);
  params.set('right', state.right);

  if (state.subtitle) {
    params.set('subtitle', state.subtitle);
    if (state.subtitleColor) params.set('subtitleColor', cleanHex(state.subtitleColor));
    if (state.subX !== 0) params.set('subX', String(state.subX));
    if (state.subY !== 0) params.set('subY', String(state.subY));
  }

  if (hasCustomAccent) params.set('accent', cleanHex(state.accent));
  if (hasCustomTextColor) params.set('textColor', cleanHex(state.textColor));
  if (state.crossColor) params.set('crossColor', cleanHex(state.crossColor));
  if (state.haloColor) params.set('haloColor', cleanHex(state.haloColor));
  if (state.behind) params.set('motifsBehindText', 'true');

  if (state.x !== -15) params.set('offsetX', String(state.x));
  if (state.y !== 0) params.set('offsetY', String(state.y));
  if (state.wordGap !== 0) params.set('wordGap', String(state.wordGap));
  if (state.scale !== 1) params.set('scale', String(state.scale));
  if (state.format !== 'png') params.set('format', state.format);
  if (state.transparent) params.set('transparent', 'true');
  if (state.dark) params.set('darkMode', 'true');
  if (state.swap) params.set('swapColors', 'true');

  const trimmedPadding = state.padding.trim();
  if (trimmedPadding && trimmedPadding !== '2') {
    params.set('padding', trimmedPadding);
  }
  if (state.center !== !state.transparent) {
    params.set('center', String(state.center));
  }

  const query = params.toString();
  return `${origin}/api/logo${query ? `?${query}` : ''}`;
}
