import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';

/**
 * Dark counterparts of the light style colours. CyclOSM has no dark mode, so these are our own: land
 * goes dark, roads stay lighter than land, and the cycle network stays the most saturated element.
 */
const DARK_COLORS: Record<string, string> = {
	// Land and water
	'#eee5dc': '#1f2124',
	'#8ecbeb': '#1f3f57',
	'#ddecec': '#2c3a3d',
	'#c2debd': '#24382a',
	'#e2eecb': '#2b3a2a',
	'#95bd84': '#1d3a22',
	'#b2c068': '#3a4226',
	'#c8d7ab': '#2e3a2a',
	'#fbf0e3': '#27261f',
	'#d6ded2': '#2b322d',
	'#c5c3c3': '#3a3a3c',
	'#f5e9c6': '#3b362a',
	'#faf0e7': '#2a2a2e',
	'#ded8dd': '#2e2b33',
	'#e4dcd3': '#302d2a',
	'#e4dfdb': '#34363b',
	'#cec5be': '#44474d',
	'#e0e0e0': '#2e3036',
	'#e7ded5': '#2f2f33',
	'#eeeeee': '#33353a',
	'#dce3e0': '#33383a',
	// Roads
	'#d4d4d4': '#4a4d52',
	'#f4c3c3': '#8a4f55',
	'#f6f6f6': '#43464c',
	'#f4dfc3': '#8a6a3a',
	'#d8b267': '#c49a4a',
	'#f6f8d2': '#6e7340',
	'#b1bb5d': '#a3ad55',
	'#888888': '#6b7078',
	'#777777': '#6b7078',
	'#bbbbbb': '#5c6068',
	'#bbffba': '#3f6b47',
	'#ddffba': '#4d6b3f',
	'#62ff96': '#2fa35b',
	'#c3c3c3': '#6b7078',
	'#dcdcdc': '#7d828a',
	'#ddddff': '#9aa4c0',
	// Cycle network and paths
	'#0000ce': '#4f8dff',
	'#16a34a': '#237a49',
	'#007360': '#2fbf9f',
	'#7a5b36': '#b08d63',
	'#114021': '#86c08c',
	'#6fc794': '#1a5a36',
	'#00c0a0': '#1f7f6a',
	'#dcc3a6': '#6e5a44',
	'#0a8a3a': '#14532d',
	'#b1ffcb': '#1f6b3f',
	// Labels and POIs
	'#ffffff': '#15171a',
	'#111111': '#e8e8e8',
	'#222222': '#dddddd',
	'#444444': '#c4c4c4',
	'#666666': '#b0b0b0',
	'#3a7ca5': '#7fc2ea',
	'#ac39ac': '#e07fe0',
	'#006ac3': '#5cb3ff',
	'#004b00': '#7fd07f',
	'#3b029a': '#b79cff',
	'#284623': '#9fce95',
	'#d08f55': '#e0a877',
};

type Rgba = { r: number; g: number; b: number; a: number };

function parseColor(value: string): Rgba | undefined {
	const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)?.[1];
	if (hex) {
		const full = hex.length === 3 ? [...hex].map((digit) => digit + digit).join('') : hex;
		const n = parseInt(full, 16);
		return { r: n >> 16, g: (n >> 8) & 255, b: n & 255, a: 1 };
	}
	const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(value);
	if (!rgb) return undefined;
	return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: rgb[4] === undefined ? 1 : +rgb[4] };
}

const toHex = ({ r, g, b }: Pick<Rgba, 'r' | 'g' | 'b'>) =>
	'#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** Fallback for colours inherited from VersaTiles: flips lightness and keeps the hue. */
function invertLightness(color: Rgba): string {
	const channels = [color.r / 255, color.g / 255, color.b / 255];
	const max = Math.max(...channels);
	const min = Math.min(...channels);
	const shift = 1 - (max + min);
	const [r, g, b] = channels.map((channel) => Math.min(1, Math.max(0, channel + shift)) * 255);
	return toHex({ r, g, b });
}

/** The dark counterpart of a colour string, or undefined if the string is not a colour. */
export function darkColor(value: string): string | undefined {
	const color = parseColor(value);
	if (!color) return undefined;
	const dark = DARK_COLORS[toHex(color)] ?? invertLightness(color);
	if (color.a === 1) return dark;
	const { r, g, b } = parseColor(dark)!;
	return `rgba(${r},${g},${b},${color.a})`;
}

function convert(value: unknown): unknown {
	if (typeof value === 'string') return darkColor(value) ?? value;
	return Array.isArray(value) ? value.map(convert) : value;
}

/** Returns a dark copy of a style, using the given sprite URL for the `cyclo` sheet. */
export function toDarkStyle(style: StyleSpecification, spriteUrl: string): StyleSpecification {
	const dark = structuredClone(style);
	dark.name = 'cycling-style-dark';
	for (const layer of dark.layers) {
		if (!layer.paint) continue;
		const paint = layer.paint as Record<string, unknown>;
		for (const key of Object.keys(paint)) paint[key] = convert(paint[key]);
	}
	if (Array.isArray(dark.sprite)) {
		dark.sprite = dark.sprite.map((sprite) => (sprite.id === 'cyclo' ? { ...sprite, url: spriteUrl } : sprite));
	}
	return dark;
}
