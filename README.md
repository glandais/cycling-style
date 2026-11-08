# cycling-style

A [MapLibre](https://maplibre.org) style for [VersaTiles](https://versatiles.org) vector tiles
(Shortbread 1.1), inspired by [CyclOSM](https://www.cyclosm.org).

**[Open the map](https://glandais.github.io/cycling-style/)**, which also lets you switch to the
VersaTiles styles.

## Using the style

The style is published at:

```
https://glandais.github.io/cycling-style/style.json
```

Pass this URL to MapLibre GL JS 5.5 or later. Tiles, fonts and base sprites are served by
`tiles.versatiles.org`, so no API key is needed.

```html
<!doctype html>
<html>
	<head>
		<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" />
		<script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>
		<style>
			html, body, #map { height: 100%; margin: 0; }
		</style>
	</head>
	<body>
		<div id="map"></div>
		<script>
			new maplibregl.Map({
				container: 'map',
				style: 'https://glandais.github.io/cycling-style/style.json',
				center: [2.3522, 48.8566],
				zoom: 14,
			});
		</script>
	</body>
</html>
```

Keep the map attribution visible: "© OpenStreetMap contributors" is required by the data licence.
It is shown automatically by MapLibre's default attribution control.

### Self-hosting

To host the style yourself, publish `public/` and generate `style.json` with the absolute URL of
your copy of the sprite, without extension:

```sh
SPRITE_URL=https://example.org/sprites/cyclo npm run build:style
```

### Coverage

The style only uses data available in Shortbread 1.1:

- On-road cycle lanes, cycle routes, mountain bike scales and speed limits are not in the schema
  and are not drawn.
- Cycleways and paths only exist from zoom 13, and POIs from zoom 14.
- Paths with `bicycle=yes` are drawn as shared cycleways. Shortbread merges `bicycle=designated`
  into `yes`, so some paths that merely allow bicycles appear in that colour.

## Development

```sh
npm install
npm run build   # generates public/style.json and the sprites
npm run dev     # serves the viewer; the comparison with CyclOSM is at /compare.html
npm test
```

`npm run build:sprite` reads icons from the reference repositories in `ref/`, which are not part of
this repository. The generated files in `public/` are committed, so this step is only needed when
changing icons. `npm run build:style` works on its own.

`npm run sheets` renders side-by-side PNG sheets against CyclOSM into `.cache/sheets/`, without a
browser. It downloads many tiles on its first run.

Pushes to `develop` publish the viewer and the style to GitHub Pages.

See [LICENSES.md](LICENSES.md) for licensing and attribution.
