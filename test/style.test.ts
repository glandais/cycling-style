import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { osm } from '@versatiles/style';
import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { PATCHED_LAYER_IDS } from '../build/overrides.ts';
import { buildDarkStyle, buildStyle } from '../build/style.ts';

let style: StyleSpecification;
const indexOf = (id: string) => style.layers.findIndex((layer) => layer.id === id);

beforeAll(async () => {
	style = await buildStyle();
}, 30_000);

describe('generated style', () => {
	it('is valid', () => {
		expect(validateStyleMin(style)).toEqual([]);
	});

	it('has unique layer ids', () => {
		const ids = style.layers.map((layer) => layer.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('keeps the VersaTiles slots', () => {
		for (const slot of Object.values(osm.slots)) expect(indexOf(slot)).toBeGreaterThanOrEqual(0);
	});

	it('stacks tunnels, surface and bridges with railways in each level', () => {
		const order = [
			'cyclo-tunnel-road-fill',
			'tunnel-transport-rail',
			'cyclo-surface-road-fill',
			'transport-rail',
			'cyclo-bridge-road-fill',
			'bridge-transport-rail',
		].map(indexOf);
		expect(order.every((index) => index >= 0)).toBe(true);
		expect(order).toEqual([...order].sort((a, b) => a - b));
	});

	it('finds every layer it patches', () => {
		for (const id of PATCHED_LAYER_IDS) expect(indexOf(id), id).toBeGreaterThanOrEqual(0);
	});

	it('references exactly the icons of the sprite', () => {
		const sprite = Object.keys(JSON.parse(readFileSync('public/sprites/cyclo.json', 'utf8')));
		const used = new Set(JSON.stringify(style.layers).match(/cyclo:[a-z_]+/g)!.map((id) => id.slice(6)));
		expect([...used].sort()).toEqual([...sprite].sort());
	});

	it('draws every Shortbread area kind that CyclOSM styles', () => {
		const fills = JSON.stringify(style.layers.filter((layer) => layer.type === 'fill'));
		for (const kind of ['canal', 'brownfield', 'swamp', 'marsh', 'bog', 'orchard', 'vineyard', 'quarry', 'scree', 'danger_area']) {
			expect(fills, kind).toContain(`"${kind}"`);
		}
	});

	it('contains no relief', () => {
		expect(Object.values(style.sources).some((source) => source.type === 'raster-dem')).toBe(false);
		expect(style.layers.some((layer) => layer.type === 'hillshade')).toBe(false);
	});
});

describe('dark style', () => {
	it('is valid and only differs in its colours', () => {
		const dark = buildDarkStyle(style);
		expect(validateStyleMin(dark)).toEqual([]);
		expect(dark.layers.map((layer) => layer.id)).toEqual(style.layers.map((layer) => layer.id));
	});

	it('has a dark background and its own sprite', () => {
		const dark = buildDarkStyle(style);
		expect(JSON.stringify(dark.layers.map((layer) => layer.paint))).not.toMatch(/rgb\(238,229,220\)|#eee5dc/i);
		expect(JSON.stringify(dark.sprite)).toContain('cyclo-dark');
		const light = Object.keys(JSON.parse(readFileSync('public/sprites/cyclo.json', 'utf8')));
		const icons = Object.keys(JSON.parse(readFileSync('public/sprites/cyclo-dark.json', 'utf8')));
		expect(icons.sort()).toEqual(light.sort());
	});
});
