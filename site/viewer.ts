import { inlineSources, osm } from '@versatiles/style';
import { Map as MapLibreMap, NavigationControl, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { loadCyclingStyle } from './cycling-style.ts';

const CYCLING = ['cycling-style', 'cycling-style-dark', 'cycling-style-road', 'cycling-style-road-dark'];

function loadStyle(name: string): Promise<StyleSpecification> {
	if (CYCLING.includes(name)) return loadCyclingStyle(name);
	return inlineSources(
		osm({
			theme: name as (typeof osm.palettes)[number],
			projection: 'mercator',
			light: false,
			sky: false,
			// Required in the browser: the default would be this page's own origin.
			urls: { base: 'https://tiles.versatiles.org' },
		})
	) as Promise<StyleSpecification>;
}

const picker = document.querySelector<HTMLSelectElement>('#style')!;
const addGroup = (label: string, names: readonly string[]) => {
	const group = document.createElement('optgroup');
	group.label = label;
	group.append(...names.map((name) => new Option(name, name)));
	picker.append(group);
};
addGroup('Cycling', CYCLING);
addGroup('VersaTiles', osm.palettes);

const requested = new URLSearchParams(location.search).get('style');
picker.value = requested && [...CYCLING, ...osm.palettes].includes(requested as never) ? requested : CYCLING[0];

const map = new MapLibreMap({
	container: 'map',
	style: await loadStyle(picker.value),
	center: [2.3522, 48.8566],
	zoom: 14,
	maxZoom: 20,
	hash: true,
});
map.addControl(new NavigationControl());

picker.addEventListener('change', async () => {
	const name = picker.value;
	const style = await loadStyle(name);
	// A slower, earlier selection must not replace the current one.
	if (name !== picker.value) return;
	const url = new URL(location.href);
	url.searchParams.set('style', name);
	history.replaceState(null, '', url);
	// Sprites and layers differ between styles, so MapLibre must rebuild everything.
	map.setStyle(style, { diff: false });
});

// Exposed for debugging and automated checks.
Object.assign(window, { map });
