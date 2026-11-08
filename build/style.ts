import { mkdir, writeFile } from 'node:fs/promises';
import { inlineSources, osm } from '@versatiles/style';
import type { LayerSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { toDarkStyle } from './dark.ts';
import { osmColors } from './palette.ts';
import { applyOverrides } from './overrides.ts';
import { insertPatterns } from './patterns.ts';
import { poiLayers } from './pois.ts';
import { toRoadStyle } from './road.ts';
import { areaLayers, onewayLayer, roadLayers } from './roads.ts';

const { belowStreets, belowSymbols, belowLabels } = osm.slots;

/** POIs are drawn under place names but above every other label, as in CyclOSM. */
const POI_ANCHOR = 'label-place-neighbourhood';

/**
 * Absolute URL of the sprite. MapLibre requires one; the comparison site replaces it at runtime.
 * Set SPRITE_URL when publishing `style.json` for use elsewhere.
 */
const SPRITE_URL = process.env.SPRITE_URL ?? 'https://example.invalid/sprites/cyclo';

/**
 * Inserts the road stack into the VersaTiles layers. VersaTiles interleaves railways with each road
 * level, so its layers between the two slots are split per level and put back on top of our roads.
 */
export function assembleLayers(layers: LayerSpecification[]): LayerSpecification[] {
	const start = layers.findIndex((layer) => layer.id === belowStreets);
	const end = layers.findIndex((layer) => layer.id === belowSymbols);
	if (start < 0 || end < 0) throw new Error('VersaTiles slots not found: check the @versatiles/style version');

	const transport = layers.slice(start + 1, end);
	const tunnel = transport.filter((layer) => layer.id.startsWith('tunnel-'));
	const bridge = transport.filter((layer) => layer.id.startsWith('bridge-'));
	const surface = transport.filter((layer) => !tunnel.includes(layer) && !bridge.includes(layer));

	const labels = layers.findIndex((layer) => layer.id === belowLabels);
	const anchor = layers.findIndex((layer) => layer.id === POI_ANCHOR);
	if (anchor < end) throw new Error(`Layer ${POI_ANCHOR} not found: check the @versatiles/style version`);

	return [
		...layers.slice(0, start + 1),
		...roadLayers('tunnel'),
		...tunnel,
		...areaLayers(),
		...roadLayers('surface'),
		...surface,
		...roadLayers('bridge'),
		...bridge,
		...layers.slice(end, labels),
		onewayLayer(),
		...layers.slice(labels, anchor),
		...poiLayers(),
		...layers.slice(anchor),
	];
}

/** Builds the complete cycling style as a MapLibre style object. */
export async function buildStyle(): Promise<StyleSpecification> {
	const style = osm({
		theme: 'colorful',
		colors: osmColors,
		projection: 'mercator',
		light: false,
		sky: false,
		features: { hillshade: false, terrain: false },
		layers: { roads: false, pois: false, markings: false },
		urls: {
			base: 'https://tiles.versatiles.org',
			sprite: [
				{ id: 'base', url: '/assets/sprites/base' },
				{ id: 'cyclo', url: SPRITE_URL },
			],
		},
	});
	style.name = 'cycling-style';
	style.layers = assembleLayers(insertPatterns(applyOverrides(style.layers)));
	return inlineSources(style);
}

/** Builds the dark variant from an already built light style. */
export function buildDarkStyle(style: StyleSpecification): StyleSpecification {
	return toDarkStyle(style, `${SPRITE_URL}-dark`);
}

if (import.meta.main) {
	await mkdir('public', { recursive: true });
	const style = await buildStyle();
	await writeFile('public/style.json', JSON.stringify(style));
	await writeFile('public/style-dark.json', JSON.stringify(buildDarkStyle(style)));
	const road = toRoadStyle(style);
	await writeFile('public/style-road.json', JSON.stringify(road));
	await writeFile('public/style-road-dark.json', JSON.stringify({ ...buildDarkStyle(road), name: 'cycling-style-road-dark' }));
	console.log('Wrote the four style variants to public/');
}
