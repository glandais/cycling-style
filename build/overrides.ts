import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import { palette } from './palette.ts';

type Patch = { paint?: Record<string, unknown>; layout?: Record<string, unknown>; minzoom?: number };

const kind = ['get', 'kind'];

/** [MapLibre zoom, size] pairs: the CyclOSM sizes of placenames.mss and labels.mss, shifted by one zoom. */
const sizes = (...stops: [number, number][]) => ['interpolate', ['linear'], ['zoom'], ...stops.flat()];

const PLACE_HALO = {
	'text-halo-color': 'rgba(255,255,255,0.66)',
	'text-halo-width': 1.5,
	'text-halo-blur': 0,
};
const STREET_HALO = { 'text-halo-color': '#ffffff', 'text-halo-width': 1, 'text-halo-blur': 0 };

const placeLabel = (color: string, ...stops: [number, number][]): Patch => ({
	layout: { 'text-size': sizes(...stops), 'text-transform': 'none' },
	paint: { 'text-color': color, ...PLACE_HALO },
});

const streetLabel = (minzoom: number, ...stops: [number, number][]): Patch => ({
	minzoom,
	layout: { 'text-size': sizes(...stops) },
	paint: { 'text-color': palette.label, ...STREET_HALO },
});

const MAJOR_STREET: [number, number][] = [[12, 8], [13, 9], [14, 10], [16, 11], [18, 12]];
const MIDDLE_STREET: [number, number][] = [[13, 9], [16, 11], [18, 12]];
const MINOR_STREET: [number, number][] = [[15, 9], [16, 11], [18, 12]];

const waterLabel: Patch = { layout: { 'text-font': ['noto_sans_regular_italic'] } };

/** Adjustments of layers inherited from VersaTiles, by layer id. */
const PATCHES: Record<string, Patch> = {
	'land-grass': {
		paint: {
			'fill-color': ['match', kind, ['meadow', 'wet_meadow'], palette.meadow, palette.grass],
		},
	},
	'land-park': { paint: { 'fill-color': palette.grass } },
	'land-vegetation': {
		paint: { 'fill-color': ['match', kind, 'heath', palette.heath, palette.scrub] },
	},

	'label-place-neighbourhood': placeLabel('#444444', [15, 12]),
	'label-place-quarter': placeLabel('#444444', [15, 12]),
	'label-place-suburb': placeLabel('#444444', [14, 12], [15, 14]),
	'label-place-hamlet': placeLabel('#444444', [13, 10], [16, 12]),
	'label-place-village': placeLabel('#111111', [9, 10], [12, 11], [13, 13], [14, 14], [15, 15]),
	'label-place-town': placeLabel('#111111', [8, 10], [10, 11], [11, 13], [13, 15]),
	'label-place-city': placeLabel('#111111', [7, 10], [8, 12], [9, 13], [10, 14], [13, 15]),
	'label-place-statecapital': placeLabel('#111111', [7, 13], [9, 14], [10, 15]),
	'label-place-capital': placeLabel('#111111', [7, 13], [9, 14], [10, 15]),

	'label-street-trunk': streetLabel(12, ...MAJOR_STREET),
	'label-street-primary': streetLabel(12, ...MAJOR_STREET),
	'label-street-secondary': streetLabel(13, ...MIDDLE_STREET),
	'label-street-tertiary': streetLabel(13, ...MIDDLE_STREET),
	'label-street-unclassified': streetLabel(15, ...MINOR_STREET),
	'label-street-residential': streetLabel(15, ...MINOR_STREET),
	'label-street-livingstreet': streetLabel(15, ...MINOR_STREET),
	'label-street-pedestrian': streetLabel(15, ...MINOR_STREET),
	'label-street-pedestrian-zone': streetLabel(15, ...MINOR_STREET),
	'label-street-track': streetLabel(15, ...MINOR_STREET),

	'label-water-river': waterLabel,
	'label-water-stream': waterLabel,
	'label-water-area-major': waterLabel,
	'label-water-area-large': waterLabel,
	'label-water-area-medium': waterLabel,
	'label-water-area-small': waterLabel,
};

/** The ids this module expects to find, so that a VersaTiles update cannot silently drop a patch. */
export const PATCHED_LAYER_IDS = Object.keys(PATCHES);

export function applyOverrides(layers: LayerSpecification[]): LayerSpecification[] {
	return layers.map((layer) => {
		const patch = PATCHES[layer.id];
		if (!patch) return layer;
		const { paint, layout, minzoom } = patch;
		return {
			...layer,
			...(minzoom === undefined ? {} : { minzoom }),
			paint: { ...layer.paint, ...paint },
			layout: { ...layer.layout, ...layout },
		} as LayerSpecification;
	});
}
