import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import { palette } from './palette.ts';
import { SOURCE } from './roads.ts';

type Layer = LayerSpecification;

/** Land textures of base.mss: MapLibre cannot combine a colour and a pattern, so they are overlays. */
const LAND_PATTERNS: { id: string; kinds: string[]; minzoom: number; opacity?: number }[] = [
	{ id: 'wetland', kinds: ['swamp', 'bog', 'string_bog', 'marsh', 'wet_meadow'], minzoom: 11 },
	{ id: 'rock', kinds: ['bare_rock'], minzoom: 11 },
	{ id: 'scree', kinds: ['scree', 'shingle'], minzoom: 11 },
	{ id: 'scrub', kinds: ['scrub'], minzoom: 11 },
	{ id: 'quarry', kinds: ['quarry'], minzoom: 11 },
	{ id: 'vineyard', kinds: ['vineyard'], minzoom: 12 },
	{ id: 'orchard', kinds: ['orchard'], minzoom: 12 },
	{ id: 'allotments', kinds: ['allotments'], minzoom: 12 },
	{ id: 'cemetery', kinds: ['cemetery', 'grave_yard'], minzoom: 12, opacity: 0.15 },
];

const DANGER_FILTER = ['==', ['get', 'kind'], 'danger_area'];

function landPatterns(): Layer[] {
	return LAND_PATTERNS.map(({ id, kinds, minzoom, opacity }) => ({
		id: `cyclo-pattern-${id}`,
		type: 'fill',
		source: SOURCE,
		'source-layer': 'land',
		minzoom,
		filter: ['in', ['get', 'kind'], ['literal', kinds]],
		paint: { 'fill-pattern': `cyclo:pattern_${id}`, ...(opacity === undefined ? {} : { 'fill-opacity': opacity }) },
	})) as unknown as Layer[];
}

function dangerLayers(): Layer[] {
	return [
		{
			id: 'cyclo-pattern-danger',
			type: 'fill',
			source: SOURCE,
			'source-layer': 'sites',
			filter: DANGER_FILTER,
			paint: { 'fill-pattern': 'cyclo:pattern_danger' },
		},
		{
			id: 'cyclo-danger-outline',
			type: 'line',
			source: SOURCE,
			'source-layer': 'sites',
			filter: DANGER_FILTER,
			paint: { 'line-color': palette.military, 'line-opacity': 0.2, 'line-width': 2, 'line-offset': -1 },
		},
	] as unknown as Layer[];
}

function insertAfter(layers: Layer[], id: string, added: Layer[]): Layer[] {
	const index = layers.findIndex((layer) => layer.id === id);
	if (index < 0) throw new Error(`Layer ${id} not found: check the @versatiles/style version`);
	return [...layers.slice(0, index + 1), ...added, ...layers.slice(index + 1)];
}

/** Adds the patterns right above the land and site layers they decorate. */
export function insertPatterns(layers: Layer[]): Layer[] {
	return insertAfter(insertAfter(layers, 'land-wetland', landPatterns()), 'site-construction', dangerLayers());
}
