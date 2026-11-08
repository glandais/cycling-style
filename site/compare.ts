import { Map as MapLibreMap, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { loadCyclingStyle } from './cycling-style.ts';

type View = { center: [number, number]; zoom: number };

const PRESETS: Record<string, View> = {
	'City (Paris)': { center: [2.3522, 48.8566], zoom: 14 },
	'Suburbs (Rennes)': { center: [-1.7, 48.09], zoom: 13.5 },
	'Countryside (Brittany)': { center: [-3.2, 48.2], zoom: 14 },
	'Mountains (Alps)': { center: [6.87, 45.92], zoom: 14 },
};

const CYCLOSM: StyleSpecification = {
	version: 8,
	sources: {
		cyclosm: {
			type: 'raster',
			tiles: ['a', 'b', 'c'].map((s) => `https://${s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png`),
			// With 256 px raster tiles MapLibre keeps both maps at the same ground scale for the same zoom.
			tileSize: 256,
			maxzoom: 20,
			attribution:
				'<a href="https://www.cyclosm.org">CyclOSM</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		},
	},
	layers: [{ id: 'cyclosm', type: 'raster', source: 'cyclosm' }],
};

function readHash(): View {
	const [zoom, lat, lon] = location.hash.slice(1).split('/').map(Number);
	if ([zoom, lat, lon].every(Number.isFinite)) return { center: [lon, lat], zoom };
	return Object.values(PRESETS)[0];
}

function writeHash(map: MapLibreMap): void {
	const { lng, lat } = map.getCenter();
	history.replaceState(null, '', `#${map.getZoom().toFixed(2)}/${lat.toFixed(5)}/${lng.toFixed(5)}`);
}

/** Mirrors every camera change of `source` onto `target`. */
function follow(source: MapLibreMap, target: MapLibreMap, state: { active: MapLibreMap | null }): void {
	source.on('move', () => {
		if (state.active === target) return;
		state.active = source;
		target.jumpTo({ center: source.getCenter(), zoom: source.getZoom(), bearing: source.getBearing(), pitch: source.getPitch() });
		state.active = null;
		writeHash(source);
	});
}

const view = readHash();
const left = new MapLibreMap({ container: 'left', style: CYCLOSM, ...view, maxZoom: 20 });
const right = new MapLibreMap({ container: 'right', style: await loadCyclingStyle(), ...view, maxZoom: 20 });
const syncState: { active: MapLibreMap | null } = { active: null };
follow(left, right, syncState);
follow(right, left, syncState);

for (const [name, preset] of Object.entries(PRESETS)) {
	const button = document.createElement('button');
	button.textContent = name;
	button.addEventListener('click', () => left.jumpTo(preset));
	document.getElementById('presets')!.append(button);
}

// Exposed for debugging and automated checks.
Object.assign(window, { left, right });
