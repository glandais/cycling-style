import { mkdir, writeFile } from 'node:fs/promises';
import { inlineSources, osm } from '@versatiles/style';
import { osmColors } from './palette.ts';

/** Builds the complete cycling style as a MapLibre style object. */
export async function buildStyle() {
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
	return inlineSources(style);
}

if (import.meta.main) {
	await mkdir('public', { recursive: true });
	await writeFile('public/style.json', JSON.stringify(await buildStyle()));
	console.log('Wrote public/style.json');
}
