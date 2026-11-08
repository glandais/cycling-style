import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { renderToPNG } from '@versatiles/png-renderer';
import sharp from 'sharp';

/** Renders CyclOSM and cycling-style side by side, in `.cache/sheets`, for a set of places and zooms. */

const WIDTH = 640;
const HEIGHT = 480;
const PLACES = {
	city: [2.3522, 48.8566],
	suburbs: [-1.7, 48.09],
	countryside: [-3.2, 48.2],
	mountains: [6.87, 45.92],
} as const;
const ZOOMS = [13, 14.5, 16];

const CYCLOSM = {
	version: 8,
	sources: {
		cyclosm: {
			type: 'raster',
			tiles: ['https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'],
			tileSize: 256,
			maxzoom: 20,
		},
	},
	layers: [{ id: 'cyclosm', type: 'raster', source: 'cyclosm' }],
};

const LOCAL_SPRITE = 'https://example.invalid/sprites/cyclo';

/** Fetch with a disk cache, serving the local sprite. It keeps requests to tile servers to a minimum. */
async function cachedFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
	const url = input instanceof Request ? input.url : String(input);
	if (url.startsWith(LOCAL_SPRITE)) return new Response(await readFile(`public/sprites/cyclo${url.slice(LOCAL_SPRITE.length)}`));
	const path = `.cache/fetch/${createHash('sha1').update(url).digest('hex')}`;
	try {
		return new Response(await readFile(path));
	} catch {
		const response = await fetch(input, init);
		if (!response.ok) return response;
		const body = Buffer.from(await response.arrayBuffer());
		await writeFile(path, body);
		return new Response(body);
	}
}

await mkdir('.cache/fetch', { recursive: true });
await mkdir('.cache/sheets', { recursive: true });
const style = JSON.parse(await readFile('public/style.json', 'utf8'));
const warnings = new Set<string>();

for (const [name, [lon, lat]] of Object.entries(PLACES)) {
	for (const zoom of ZOOMS) {
		const render = (mapStyle: object, factor = 1) =>
			renderToPNG({
				style: mapStyle,
				width: WIDTH * factor,
				height: HEIGHT * factor,
				lon,
				lat,
				zoom: zoom + Math.log2(factor),
				labels: 'glyphs',
				fetch: cachedFetch,
				onWarning: (warning: unknown) => warnings.add(String(warning)),
			} as Parameters<typeof renderToPNG>[0]);
		// The renderer draws raster tiles at 512 px whatever their tileSize: rendering twice as large one
		// zoom higher, then halving, gives 256 px tiles at the same ground scale as the vector map.
		const left = await sharp(Buffer.from(await render(CYCLOSM, 2))).resize(WIDTH, HEIGHT).png().toBuffer();
		const right = await render(style);
		const file = `.cache/sheets/${name}-z${zoom}.png`;
		await sharp({ create: { width: WIDTH * 2 + 4, height: HEIGHT, channels: 3, background: '#ffffff' } })
			.composite([
				{ input: left, left: 0, top: 0 },
				{ input: Buffer.from(right), left: WIDTH + 4, top: 0 },
			])
			.png()
			.toFile(file);
		console.log(file);
	}
}
for (const warning of warnings) console.warn(`warning: ${warning}`);
