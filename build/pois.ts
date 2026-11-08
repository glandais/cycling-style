import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import { SOURCE } from './roads.ts';

type Layer = LayerSpecification;
type Rule = { key: string; values: string[]; icon: string };

/**
 * POI groups by first MapLibre zoom: the zooms of amenities.mss shifted by one, and never below
 * zoom 14, where the `pois` layer starts. Within a group, earlier rules are placed first.
 */
const GROUPS: { minzoom: number; rules: Rule[] }[] = [
	{
		minzoom: 14,
		rules: [
			{ key: 'shop', values: ['bicycle'], icon: 'bicycle' },
			{ key: 'tourism', values: ['camp_site'], icon: 'camping' },
			{ key: 'tourism', values: ['caravan_site'], icon: 'caravan' },
			{ key: 'tourism', values: ['alpine_hut'], icon: 'chalet' },
			{ key: 'amenity', values: ['hospital'], icon: 'hospital' },
		],
	},
	{
		minzoom: 15,
		rules: [
			{ key: 'amenity', values: ['bicycle_rental'], icon: 'bicycle_rental' },
			{ key: 'amenity', values: ['drinking_water'], icon: 'drinking_water' },
			{ key: 'amenity', values: ['toilets'], icon: 'toilets' },
			{ key: 'amenity', values: ['shelter'], icon: 'shelter' },
			{ key: 'tourism', values: ['chalet'], icon: 'chalet' },
			{ key: 'tourism', values: ['picnic_site'], icon: 'picnic' },
			{ key: 'tourism', values: ['viewpoint'], icon: 'viewpoint' },
			{ key: 'shop', values: ['supermarket'], icon: 'supermarket' },
			{ key: 'amenity', values: ['pharmacy'], icon: 'pharmacy' },
		],
	},
	{
		minzoom: 16,
		rules: [
			{ key: 'shop', values: ['bakery'], icon: 'bakery' },
			{ key: 'shop', values: ['convenience', 'general'], icon: 'convenience' },
			{ key: 'shop', values: ['greengrocer'], icon: 'greengrocer' },
			{ key: 'amenity', values: ['fuel'], icon: 'fuel' },
			{ key: 'amenity', values: ['restaurant', 'food_court'], icon: 'restaurant' },
			{ key: 'amenity', values: ['fast_food'], icon: 'fast_food' },
			{ key: 'amenity', values: ['cafe'], icon: 'cafe' },
			{ key: 'amenity', values: ['bar', 'pub', 'biergarten'], icon: 'bar' },
			{ key: 'tourism', values: ['guest_house', 'bed_and_breakfast'], icon: 'guest_house' },
			{ key: 'tourism', values: ['hostel'], icon: 'hostel' },
			{ key: 'tourism', values: ['hotel'], icon: 'hotel' },
			{ key: 'tourism', values: ['motel'], icon: 'motel' },
		],
	},
	{
		minzoom: 17,
		rules: [{ key: 'amenity', values: ['doctors', 'clinic'], icon: 'doctors' }],
	},
	{
		minzoom: 18,
		rules: [
			{ key: 'amenity', values: ['bench'], icon: 'bench' },
			{ key: 'tourism', values: ['information'], icon: 'information' },
		],
	},
];

const name = ['coalesce', ['get', 'name'], ''];

const ruleTest = (rule: Rule) => ['in', ['get', rule.key], ['literal', rule.values]];

/** Names appear from raster zoom 18, as in CyclOSM. */
const NAME_LAYOUT = {
	'text-field': ['step', ['zoom'], '', 17, name],
	'text-font': ['noto_sans_regular'],
	'text-size': 10,
	'text-anchor': 'top',
	'text-offset': [0, 0.8],
	'text-optional': true,
};
const NAME_PAINT = { 'text-color': '#666666', 'text-halo-color': 'rgba(255,255,255,0.6)', 'text-halo-width': 1 };

/** POI layers, from bottom to top. Top layers are placed first, so the earliest zooms take priority. */
export function poiLayers(): Layer[] {
	const groups: Layer[] = GROUPS.map(({ minzoom, rules }) => ({
		id: `cyclo-poi-${minzoom}`,
		type: 'symbol',
		source: SOURCE,
		'source-layer': 'pois',
		minzoom,
		filter: ['any', ...rules.map(ruleTest)],
		layout: {
			'icon-image': ['case', ...rules.flatMap((rule) => [ruleTest(rule), `cyclo:${rule.icon}`]), ''],
			'symbol-sort-key': ['case', ...rules.flatMap((rule, i) => [ruleTest(rule), i]), rules.length],
			...NAME_LAYOUT,
		},
		paint: NAME_PAINT,
	})) as unknown as Layer[];

	const parking = {
		id: 'cyclo-poi-bicycle-parking',
		type: 'symbol',
		source: SOURCE,
		'source-layer': 'sites',
		minzoom: 15,
		filter: ['==', ['get', 'kind'], 'bicycle_parking'],
		layout: { 'icon-image': 'cyclo:bicycle_parking' },
	} as unknown as Layer;

	const peaks = {
		id: 'cyclo-poi-peak',
		type: 'symbol',
		source: SOURCE,
		'source-layer': 'mountain_peaks',
		minzoom: 12,
		filter: ['==', ['get', 'kind'], 'peak'],
		layout: {
			'icon-image': 'cyclo:peak',
			'icon-size': 0.8,
			'text-field': [
				'step',
				['zoom'],
				'',
				13,
				['concat', name, '\n', ['coalesce', ['to-string', ['get', 'ele']], ''], ' m'],
			],
			'text-font': ['noto_sans_regular'],
			'text-size': 10,
			'text-anchor': 'top',
			'text-offset': [0, 0.7],
			'text-optional': true,
		},
		paint: { 'text-color': '#d08f55', 'text-halo-color': 'rgba(255,255,255,0.6)', 'text-halo-width': 1 },
	} as unknown as Layer;

	return [peaks, ...groups.reverse(), parking];
}
