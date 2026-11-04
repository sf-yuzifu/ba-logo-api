import type { LogoFormState } from '../types.ts';

type LogoParameter = keyof LogoFormState;
type ParameterNames = Partial<Record<LogoParameter, string>>;

const PARAM_NAMES: ParameterNames = {
  left: 'left',
  right: 'right',
  subtitle: 'subtitle',
  subtitleColor: 'subtitleColor',
  subX: 'subX',
  subY: 'subY',
  subtitleFontSize: 'subtitleFontSize',
  accent: 'accent',
  textColor: 'textColor',
  crossColor: 'crossColor',
  haloColor: 'haloColor',
  behind: 'motifsBehindText',
  x: 'offsetX',
  y: 'offsetY',
  wordGap: 'wordGap',
  scale: 'scale',
  format: 'format',
  transparent: 'transparent',
  dark: 'darkMode',
  swap: 'swapColors',
  padding: 'padding',
  center: 'center',
};

function cleanHex(color: string): string {
  return color.replace(/^#/, '').trim();
}

function addParam(params: URLSearchParams, name: string, value: unknown): void {
  params.set(name, String(value));
}

/** 构造 RESTful /api/logo 请求 URL */
export function buildLogoUrl(state: Readonly<LogoFormState>, origin = ''): string {
  const params = new URLSearchParams();
  const set = (key: LogoParameter, value: unknown) => {
    const name = PARAM_NAMES[key];
    if (name) addParam(params, name, value);
  };

  set('left', state.left);
  set('right', state.right);

  if (state.subtitle) {
    set('subtitle', state.subtitle);
    if (state.subtitleColor) set('subtitleColor', cleanHex(state.subtitleColor));
    if (state.subX !== 0) set('subX', state.subX);
    if (state.subY !== 0) set('subY', state.subY);
    if (state.subtitleFontSize !== 30) set('subtitleFontSize', state.subtitleFontSize);
  }

  const defaultTextColor = state.dark ? '#ffffff' : '#2b2b2b';
  if (state.accent.trim().toLowerCase() !== '#128afa') set('accent', cleanHex(state.accent));
  if (state.textColor.trim().toLowerCase() !== defaultTextColor) {
    set('textColor', cleanHex(state.textColor));
  }
  if (state.crossColor) set('crossColor', cleanHex(state.crossColor));
  if (state.haloColor) set('haloColor', cleanHex(state.haloColor));
  if (state.behind) set('behind', 'true');

  if (state.x !== -15) set('x', state.x);
  if (state.y !== 0) set('y', state.y);
  if (state.wordGap !== 0) set('wordGap', state.wordGap);
  if (state.scale !== 1) set('scale', state.scale);
  if (state.format !== 'png') set('format', state.format);
  if (state.transparent) set('transparent', 'true');
  if (state.dark) set('dark', 'true');
  if (state.swap) set('swap', 'true');

  const padding = state.padding.trim();
  if (padding && padding !== '2') set('padding', padding);
  if (state.center !== !state.transparent) set('center', String(state.center));

  const query = params.toString();
  return `${origin}/api/logo${query ? `?${query}` : ''}`;
}
