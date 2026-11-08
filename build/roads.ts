import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import { palette, roadColors as c } from './palette.ts';

export const SOURCE = 'versatiles-shortbread';

export type Level = 'tunnel' | 'surface' | 'bridge';

type Expression = unknown[];
type Layer = LayerSpecification;

/** First MapLibre zoom of the width tables, i.e. CyclOSM raster zoom 11. */
const TABLE_ZOOM = 10;
/** Last MapLibre zoom of the width tables, i.e. CyclOSM raster zoom 18, where its widths stop growing. */
const MAX_ZOOM = TABLE_ZOOM + 7;

type RoadClass = {
	kinds: string[];
	/** Fill width in px for CyclOSM raster zooms 11 to 18. */
	fill: number[];
	/** Casing width per side in px for the same zooms. */
	casing: number[];
	/** Width of the single line drawn at MapLibre zooms 8 and 9, if any. */
	low?: [number, number];
};

// Values from the @rdz variables in roads.mss. Draw order goes from the first class to the last.
const ROADS: RoadClass[] = [
	{ kinds: ['pedestrian'], fill: [0, 0.5, 0.6, 1, 1, 2, 3, 4], casing: [0.15, 0.25, 0.6, 1, 1, 2, 3, 4] },
	{ kinds: ['service', 'busway'], fill: [0, 0, 1, 1, 2, 3.5, 6, 10], casing: [0.15, 0.25, 0.3, 0.5, 1, 1, 1, 1.75] },
	{ kinds: ['living_street'], fill: [0, 0.5, 0.6, 1, 1.5, 3, 7.5, 11], casing: [0.15, 0.25, 0.6, 1, 1, 1.5, 1.75, 3] },
	{ kinds: ['residential'], fill: [0, 0.5, 1, 1, 2, 4, 8, 14], casing: [0.2, 0.25, 0.6, 1, 1, 1, 1, 1.75] },
	{ kinds: ['unclassified'], fill: [0, 1, 1.5, 2, 3, 6, 10, 16], casing: [0.35, 1, 0.8, 1, 1, 1, 1, 1.75] },
	{ kinds: ['tertiary'], fill: [0, 1, 2, 2, 3, 6, 10, 16], casing: [0.4, 1, 1, 1, 1, 1, 1, 1.75] },
	{ kinds: ['secondary'], fill: [0.8, 1.2, 2, 2.8, 4, 8, 14, 20], casing: [0.8, 1, 1, 1, 1, 1.25, 1.25, 2], low: [0.6, 1] },
	{ kinds: ['primary'], fill: [0.8, 1.2, 2, 2.8, 4, 8, 14, 20], casing: [0.8, 1, 1, 1, 1, 1.25, 1.25, 2], low: [1, 1] },
	{ kinds: ['trunk'], fill: [1.2, 2, 3, 4, 6, 10, 16, 23], casing: [1, 1, 1, 1, 1.25, 1.25, 1.5, 2], low: [1, 1] },
	{ kinds: ['motorway'], fill: [1.2, 2, 3, 4, 6, 10, 16, 23], casing: [1, 1, 1, 1, 1.25, 1.25, 1.5, 2], low: [1, 1] },
];

const ROAD_KINDS = ROADS.flatMap((road) => road.kinds);
const MINOR_ROAD_KINDS = ['service', 'busway', 'living_street', 'residential', 'unclassified', 'tertiary', 'pedestrian'];

const WAY_WIDTHS = {
	cycle: [0.4, 0.7, 1, 2, 2, 2, 3, 4],
	path: [0.15, 0.5, 0.65, 1, 1.25, 1.25, 2, 2.5],
	track: [0.15, 0.5, 1, 1.5, 2, 3, 4, 7],
	footway: [0, 0, 0.2, 0.25, 0.5, 0.75, 1.5, 2],
	steps: [0, 0, 0.3, 0.5, 0.8, 1.25, 3, 3.5],
};

const get = (key: string): Expression => ['get', key];
const kindIn = (kinds: string[]): Expression => ['in', get('kind'), ['literal', kinds]];
const bicycleIs = (value: string): Expression => ['==', get('bicycle'), value];

/** The filter selecting the features of a level. Booleans are absent rather than false. */
export function levelFilter(level: Level): Expression {
	if (level === 'tunnel') return ['==', get('tunnel'), true];
	if (level === 'bridge') return ['==', get('bridge'), true];
	return ['all', ['!=', get('tunnel'), true], ['!=', get('bridge'), true]];
}

/** Looks up a width table at a MapLibre zoom. */
function tableValue(table: number[], zoom: number): number {
	return table[Math.max(0, Math.min(table.length - 1, zoom - TABLE_ZOOM))];
}

function zoomRamp(valueAt: (zoom: number) => unknown, firstZoom = 7): Expression {
	const stops: unknown[] = [];
	for (let zoom = firstZoom; zoom <= MAX_ZOOM; zoom++) stops.push(zoom, valueAt(zoom));
	return ['interpolate', ['linear'], ['zoom'], ...stops];
}

function matchKind(valueOf: (road: RoadClass) => number): Expression {
	return ['match', get('kind'), ...ROADS.flatMap((road) => [road.kinds, valueOf(road)]), 0];
}

function roadFillWidth(zoom: number): number | Expression {
	return matchKind((road) => {
		if (zoom < 8) return 0;
		if (zoom < TABLE_ZOOM) return road.low?.[zoom - 8] ?? 0;
		return tableValue(road.fill, zoom);
	});
}

function roadCasingWidth(zoom: number): number | Expression {
	return matchKind((road) => {
		if (zoom < TABLE_ZOOM) return 0;
		return tableValue(road.fill, zoom) + 2 * tableValue(road.casing, zoom);
	});
}

/** Fill colour of roads at MapLibre zoom 10 and above, in CyclOSM's priority order. */
function roadFillColor(): Expression {
	return [
		'match',
		get('kind'),
		'motorway',
		c.motorway,
		'trunk',
		['case', bicycleIs('yes'), c.motorwayCycle, c.motorway],
		[
			'case',
			bicycleIs('no'),
			c.noBicycle,
			['all', ['==', get('motorcar'), 'no'], bicycleIs('yes'), ['!=', get('kind'), 'pedestrian']],
			c.noMotor,
			[
				'match',
				get('kind'),
				'primary',
				c.primary,
				'secondary',
				c.secondary,
				'living_street',
				c.livingStreet,
				'pedestrian',
				c.pedestrian,
				c.standard,
			],
		],
	];
}

/** At low zoom CyclOSM draws a single line using the casing colour of primary and secondary roads. */
function roadLowColor(): Expression {
	return [
		'match',
		get('kind'),
		'primary',
		c.primaryCase,
		'secondary',
		c.secondaryCase,
		'trunk',
		['case', bicycleIs('yes'), c.motorwayCycle, c.motorway],
		c.motorway,
	];
}

function roadCasingColor(level: Level): unknown {
	const color = [
		'match',
		get('kind'),
		['motorway', 'trunk'],
		c.motorwayCase,
		'primary',
		c.primaryCase,
		'secondary',
		c.secondaryCase,
		'tertiary',
		c.tertiaryCase,
		['living_street', 'pedestrian'],
		c.pedestrianCase,
		c.standardCase,
	];
	// CyclOSM only draws the dark bridge casing from raster zoom 14.
	return level === 'bridge' ? ['step', ['zoom'], color, 13, c.bridgeCase] : color;
}

const roadSortKey: Expression = ['match', get('kind'), ...ROADS.flatMap((road, i) => [road.kinds, i]), 0];

function line(id: string, level: Level, filter: Expression, layout: object, paint: object, minzoom?: number): Layer {
	return {
		id: `cyclo-${level}-${id}`,
		type: 'line',
		source: SOURCE,
		'source-layer': 'streets',
		...(minzoom === undefined ? {} : { minzoom }),
		filter: ['all', levelFilter(level), filter],
		layout: { 'line-join': 'round', ...layout },
		paint,
	} as unknown as Layer;
}

// Surface classes, following the surface_type column of views.sql. Shortbread has no smoothness tag.
const TRACKTYPE = { road: ['grade1'], cyclocross: ['grade2', 'grade3'], mtb: ['grade4', 'grade5'] };
const SURFACE = {
	road: ['paved', 'asphalt', 'concrete', 'paving_stones'],
	cyclocross: [
		'concrete:lanes',
		'concrete:plates',
		'gravel',
		'sett',
		'unhewn_cobblestone',
		'cobblestone',
		'wood',
		'compacted',
		'fine_gravel',
		'woodchips',
	],
	mtb: ['pebblestone', 'dirt', 'earth', 'grass', 'grass_paver', 'gravel_turf', 'ground', 'mud', 'sand', 'laterite'],
};

type SurfaceClass = 'road' | 'cyclocross' | 'mtb' | 'unknown';

/** Evaluates to the surface class of a feature; fields are absent when the tag is unknown. */
export const surfaceClass: Expression = [
	'match',
	['coalesce', get('tracktype'), ''],
	TRACKTYPE.road,
	'road',
	TRACKTYPE.cyclocross,
	'cyclocross',
	TRACKTYPE.mtb,
	'mtb',
	[
		'match',
		['coalesce', get('surface'), ''],
		SURFACE.road,
		'road',
		SURFACE.cyclocross,
		'cyclocross',
		SURFACE.mtb,
		'mtb',
		'unknown',
	],
];

const surfaceIn = (classes: SurfaceClass[]): Expression => ['in', surfaceClass, ['literal', classes]];

/** Dash lengths in px for raster zooms below 16, 16, and 17+ (MapLibre below 15, 15, and 16+). */
type PixelDashes = [[number, number], [number, number], [number, number]];

const WAY_DASHES: Partial<Record<SurfaceClass, PixelDashes>> = {
	cyclocross: [[5, 2], [10, 4], [20, 8]],
	mtb: [[2, 2], [4, 4], [8, 8]],
	unknown: [[10, 1], [10, 1], [10, 1]],
};

/** MapLibre dashes are in line widths, CartoCSS ones in pixels. */
function dashExpression(dashes: PixelDashes, widthAt: (zoom: number) => number): Expression {
	const scaled = dashes.map(([dash, gap], i) => {
		const width = Math.max(widthAt(14 + i), 0.5);
		return ['literal', [dash / width, gap / width]];
	});
	return ['step', ['zoom'], scaled[0], 15, scaled[1], 16, scaled[2]];
}

type WayClass = {
	id: string;
	filter: Expression;
	table: number[];
	/** Cycleways are wider unless they are one-way. */
	bidirectionalBoost?: boolean;
	color: Record<Level, unknown>;
	surfaces: SurfaceClass[];
	/** Colour and opacity of the line under the dashes. */
	background: [string, number];
};

const sameColor = (color: unknown): Record<Level, unknown> => ({ tunnel: color, surface: color, bridge: color });
const WHITE_UNDERLAY: [string, number] = ['#ffffff', 0.4];

const designated: Expression = ['all', kindIn(['path', 'footway']), bicycleIs('yes')];

const WAYS: WayClass[] = [
	{
		id: 'footway',
		filter: ['all', ['==', get('kind'), 'footway'], ['!=', get('bicycle'), 'yes']],
		table: WAY_WIDTHS.footway,
		color: { ...sameColor(c.footway), tunnel: c.footwayTunnel },
		surfaces: ['cyclocross', 'mtb', 'unknown'],
		background: WHITE_UNDERLAY,
	},
	{
		id: 'steps',
		filter: ['==', get('kind'), 'steps'],
		table: WAY_WIDTHS.steps,
		color: sameColor(c.footway),
		surfaces: [],
		background: WHITE_UNDERLAY,
	},
	{
		id: 'track',
		filter: ['==', get('kind'), 'track'],
		table: WAY_WIDTHS.track,
		color: sameColor(['case', bicycleIs('no'), c.noBicycle, c.track]),
		surfaces: ['cyclocross', 'mtb', 'unknown'],
		background: WHITE_UNDERLAY,
	},
	{
		id: 'path',
		filter: ['all', ['==', get('kind'), 'path'], ['!=', get('bicycle'), 'yes']],
		table: WAY_WIDTHS.path,
		color: {
			...sameColor(['case', bicycleIs('no'), c.noBicycle, c.path]),
			tunnel: ['case', bicycleIs('no'), c.noBicycle, c.pathTunnel],
		},
		surfaces: ['cyclocross', 'mtb', 'unknown'],
		background: WHITE_UNDERLAY,
	},
	{
		id: 'shared',
		filter: designated,
		table: WAY_WIDTHS.cycle,
		bidirectionalBoost: true,
		color: { ...sameColor(c.mixedCycle), tunnel: c.mixedCycleTunnel },
		surfaces: ['cyclocross', 'mtb', 'unknown'],
		background: WHITE_UNDERLAY,
	},
	{
		id: 'cycleway',
		filter: ['==', get('kind'), 'cycleway'],
		table: WAY_WIDTHS.cycle,
		bidirectionalBoost: true,
		color: {
			...sameColor(['case', bicycleIs('no'), c.noBicycle, c.cycle]),
			tunnel: ['case', bicycleIs('no'), c.noBicycle, c.cycleTunnel],
		},
		// CyclOSM draws cycleways of unknown surface as a solid line.
		surfaces: ['cyclocross', 'mtb'],
		background: [c.cycleSurface, 0.6],
	},
];

function wayWidth(way: WayClass): Expression {
	const factor = way.bidirectionalBoost ? ['case', ['==', get('oneway'), true], 1, 1.5] : 1;
	return zoomRamp((zoom) => ['*', tableValue(way.table, zoom), factor], TABLE_ZOOM + 3);
}

function wayLayers(level: Level): Layer[] {
	const layers: Layer[] = [];
	const paths = kindIn(['path', 'cycleway', 'track', 'footway']);
	if (level === 'bridge') {
		// Land-coloured halo that lifts paths off whatever they cross, from raster zoom 17.
		layers.push(
			line('way-deck', level, paths, { 'line-cap': 'butt' }, {
				'line-color': palette.land,
				'line-width': ['interpolate', ['linear'], ['zoom'], 16, 4, 17, 7],
			}, 16)
		);
	}
	for (const way of WAYS) {
		const width = wayWidth(way);
		const color = way.color[level];
		const solid: SurfaceClass[] = (['road', 'cyclocross', 'mtb', 'unknown'] as const).filter(
			(surface) => !way.surfaces.includes(surface)
		);
		if (way.surfaces.length > 0) {
			const [underlay, opacity] = way.background;
			layers.push(
				line(`${way.id}-underlay`, level, ['all', way.filter, surfaceIn(way.surfaces)], { 'line-cap': 'butt' }, {
					'line-color': underlay,
					'line-opacity': opacity,
					'line-width': width,
				})
			);
		}
		layers.push(
			line(way.id, level, ['all', way.filter, surfaceIn(solid)], { 'line-cap': 'round' }, {
				'line-color': color,
				'line-width': width,
				...(way.id === 'steps' ? { 'line-dasharray': [0.5, 0.25] } : {}),
			})
		);
		for (const surface of way.surfaces) {
			layers.push(
				line(`${way.id}-${surface}`, level, ['all', way.filter, surfaceIn([surface])], { 'line-cap': 'butt' }, {
					'line-color': color,
					'line-width': width,
					'line-dasharray': dashExpression(WAY_DASHES[surface]!, (zoom) => tableValue(way.table, zoom)),
				})
			);
		}
	}
	return layers;
}

/** Light dashes laid over minor roads that are not paved, from raster zoom 14. */
function roadSurfaceLayers(level: Level): Layer[] {
	const residentialWidth = (zoom: number) => tableValue(ROADS[3].fill, zoom);
	const variants: [SurfaceClass, string, PixelDashes][] = [
		['cyclocross', c.roadSurfaceRough, [[4, 8], [6, 12], [8, 16]]],
		['mtb', c.roadSurfaceBad, [[10, 5], [14, 7], [20, 10]]],
	];
	return variants.map(([surface, color, dashes]) =>
		line(`road-surface-${surface}`, level, ['all', kindIn(MINOR_ROAD_KINDS), surfaceIn([surface])], { 'line-cap': 'butt' }, {
			'line-color': color,
			'line-opacity': 0.6,
			'line-width': zoomRamp(roadFillWidth, TABLE_ZOOM + 3),
			'line-dasharray': dashExpression(dashes, residentialWidth),
		}, 13)
	);
}

/** All the road and path layers of one level, from bottom to top. */
export function roadLayers(level: Level): Layer[] {
	const roads = kindIn(ROAD_KINDS);
	const cap = level === 'surface' ? 'round' : 'butt';
	const casing = line('road-casing', level, roads, { 'line-cap': cap, 'line-sort-key': roadSortKey }, {
		'line-color': roadCasingColor(level),
		'line-width': zoomRamp(roadCasingWidth),
		...(level === 'tunnel' ? { 'line-dasharray': [3, 3] } : {}),
	}, 10);
	const fill = line('road-fill', level, roads, { 'line-cap': 'round', 'line-sort-key': roadSortKey }, {
		'line-color': ['step', ['zoom'], roadLowColor(), TABLE_ZOOM, roadFillColor()],
		'line-width': zoomRamp(roadFillWidth),
	}, 8);
	return [casing, fill, ...roadSurfaceLayers(level), ...wayLayers(level)];
}

/** Areas that `layers.roads: false` removes from the VersaTiles style: bridge decks and pedestrian zones. */
export function areaLayers(): Layer[] {
	return [
		{
			id: 'cyclo-bridge-area',
			type: 'fill',
			source: SOURCE,
			'source-layer': 'bridges',
			paint: { 'fill-color': palette.land },
		},
		{
			id: 'cyclo-pedestrian-area',
			type: 'fill',
			source: SOURCE,
			'source-layer': 'street_polygons',
			filter: ['==', get('kind'), 'pedestrian'],
			paint: { 'fill-color': c.pedestrianArea },
		},
	] as unknown as Layer[];
}
