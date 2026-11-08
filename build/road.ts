import type { LayerSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';

/** How visible paths and tracks stay on the road cycling map. */
export const WAY_OPACITY = 0.25;

const LEVEL = '^cyclo-(tunnel|surface|bridge)-';
const WAYS = '(footway|steps|track|path|shared|cycleway)';
const FADED_WAY = new RegExp(`${LEVEL}${WAYS}(-cyclocross|-mtb|-unknown)?$`);
const HIDDEN_WAY = new RegExp(`${LEVEL}(${WAYS}-underlay|way-deck)$`);
const WAY_KINDS = ['footway', 'steps', 'track', 'path', 'cycleway'];

function isKept(layer: LayerSpecification): boolean {
	return !HIDDEN_WAY.test(layer.id) && layer.id !== 'label-street-track';
}

function adapt(layer: LayerSpecification): LayerSpecification {
	if (FADED_WAY.test(layer.id)) return { ...layer, paint: { ...layer.paint, 'line-opacity': WAY_OPACITY } } as LayerSpecification;
	if (layer.id === 'cyclo-oneway') {
		const notWay = ['!', ['in', ['get', 'kind'], ['literal', WAY_KINDS]]];
		return { ...layer, filter: ['all', (layer as { filter?: unknown }).filter, notWay] } as unknown as LayerSpecification;
	}
	return layer;
}

/** Returns the road cycling variant of a style: roads are unchanged, paths and tracks barely show. */
export function toRoadStyle(style: StyleSpecification): StyleSpecification {
	return { ...style, name: 'cycling-style-road', layers: style.layers.filter(isKept).map(adapt) };
}
