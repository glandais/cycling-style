import { mkdir, writeFile } from 'node:fs/promises';
import { inlineSources, osm } from '@versatiles/style';
import type { LayerSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { osmColors } from './palette.ts';
import { areaLayers, roadLayers } from './roads.ts';

const { belowStreets, belowSymbols } = osm.slots;

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

	return [
		...layers.slice(0, start + 1),
		...roadLayers('tunnel'),
		...tunnel,
		...areaLayers(),
		...roadLayers('surface'),
		...surface,
		...roadLayers('bridge'),
		...bridge,
		...layers.slice(end),
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
		urls: { base: 'https://tiles.versatiles.org' },
	});
	style.name = 'cycling-style';
	style.layers = assembleLayers(style.layers);
	return inlineSources(style);
}

if (import.meta.main) {
	await mkdir('public', { recursive: true });
	await writeFile('public/style.json', JSON.stringify(await buildStyle()));
	console.log('Wrote public/style.json');
}
