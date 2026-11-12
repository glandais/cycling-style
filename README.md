# @glandais/cycling-style

[![npm version](https://img.shields.io/npm/v/@glandais/cycling-style.svg)](https://www.npmjs.com/package/@glandais/cycling-style)
[![Release](https://github.com/glandais/cycling-style/actions/workflows/release.yml/badge.svg)](https://github.com/glandais/cycling-style/actions/workflows/release.yml)
[![CI](https://github.com/glandais/cycling-style/actions/workflows/ci.yml/badge.svg)](https://github.com/glandais/cycling-style/actions/workflows/ci.yml)

A [MapLibre](https://maplibre.org) style for cycling, built on [VersaTiles](https://versatiles.org)
vector tiles (Shortbread 1.1) and inspired by [CyclOSM](https://www.cyclosm.org).

- 🚀 **[GitHub](https://github.com/glandais/cycling-style)**
- 📦 **[npm package](https://www.npmjs.com/package/@glandais/cycling-style)**
- 📦 **[jsdelivr](https://www.jsdelivr.com/package/npm/@glandais/cycling-style)**
- 🌐 **[Live map](https://glandais.github.io/cycling-style/)**, which also lets you switch to the
  VersaTiles styles

## Features

- 🚴 **Cycling first**: cycleways, shared paths and tracks stand out from the road network
- 🛤️ **Surfaces**: unpaved minor roads are dashed, by surface and track grade
- 🌗 **Light and dark** variants of every style
- 🛣️ **Road cycling** variants, where paths and tracks barely show
- 📍 **POIs for the ride** (bike shops, bike rental, drinking water, camp sites…), from zoom 14
- 🔑 **No API key**: tiles, fonts and base sprites are served by `tiles.versatiles.org`
- 📦 **Plain JSON**: four MapLibre style documents, with no runtime dependency

## Variants

| Variant             | File                   | Description                                 |
| ------------------- | ---------------------- | ------------------------------------------- |
| Default             | `style.json`           | All cycling infrastructure                  |
| Dark                | `style-dark.json`      | Same map on a dark background               |
| Road cycling        | `style-road.json`      | Roads only: paths and tracks barely visible |
| Road cycling (dark) | `style-road-dark.json` | Road cycling on a dark background           |

## Installation

### npm

```sh
npm install @glandais/cycling-style
```

```js
import style from '@glandais/cycling-style/style.json' with { type: 'json' };
import dark from '@glandais/cycling-style/style-dark.json' with { type: 'json' };
```

### CDN

Each variant can be used directly as a style URL:

```
https://cdn.jsdelivr.net/npm/@glandais/cycling-style@1/dist/style.json
```

The latest build of the `develop` branch is also published on GitHub Pages:

```
https://glandais.github.io/cycling-style/style.json
```

## Quick Start

The style needs MapLibre GL JS 5.5 or later.

### With a bundler

```js
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import style from '@glandais/cycling-style/style.json' with { type: 'json' };

new maplibregl.Map({
	container: 'map',
	style,
	center: [2.3522, 48.8566],
	zoom: 14,
});
```

### In a page

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
				style: 'https://cdn.jsdelivr.net/npm/@glandais/cycling-style@1/dist/style.json',
				center: [2.3522, 48.8566],
				zoom: 14,
			});
		</script>
	</body>
</html>
```

## Self-hosting

The styles load their icons from the sprite published on GitHub Pages
(`https://glandais.github.io/cycling-style/sprites/cyclo`, and `cyclo-dark` for the dark variants).
To serve everything yourself, host the sprites of the package (`dist/sprites/`) and point the
`cyclo` sprite at your copy, without extension:

```js
import style from '@glandais/cycling-style/style.json' with { type: 'json' };

const selfHosted = {
	...style,
	sprite: style.sprite.map((sprite) =>
		sprite.id === 'cyclo' ? { ...sprite, url: 'https://example.org/sprites/cyclo' } : sprite
	),
};
```

From a clone of the repository, the styles can also be generated with that URL (the dark styles use
the same URL followed by `-dark`):

```sh
SPRITE_URL=https://example.org/sprites/cyclo npm run build:style
```

## Attribution Requirements

Keep the map attribution visible: "© OpenStreetMap contributors" is required by the data licence.
It is shown automatically by MapLibre's default attribution control.

## Coverage

The style only uses data available in Shortbread 1.1:

- On-road cycle lanes, cycle routes, mountain bike scales and speed limits are not in the schema
  and are not drawn.
- Cycleways and paths only exist from zoom 13, and POIs from zoom 14.
- Paths with `bicycle=yes` are drawn as shared cycleways. Shortbread merges `bicycle=designated`
  into `yes`, so some paths that merely allow bicycles appear in that colour.

## Development

### Setup

```sh
git clone https://github.com/glandais/cycling-style.git
cd cycling-style
npm install
npm run dev     # serves the viewer; the comparison with CyclOSM is at /compare.html
```

### Scripts

| Script                  | Description                                                   |
| ----------------------- | ------------------------------------------------------------- |
| `npm run dev`           | Serves the viewer and the comparison with CyclOSM             |
| `npm run build`         | Generates the sprites and the four styles in `public/`        |
| `npm run build:style`   | Generates the four styles only                                |
| `npm run build:sprite`  | Generates the sprites only                                    |
| `npm run build:package` | Builds the npm package into `dist/`                           |
| `npm run site`          | Builds the GitHub Pages site into `dist-site/`                |
| `npm run sheets`        | Renders comparison sheets against CyclOSM                     |
| `npm test`              | Runs the tests                                                |
| `npm run typecheck`     | Checks the types                                              |

`npm run build:sprite` reads icons from the reference repositories in `ref/`, which are not part of
this repository. The generated files in `public/` are committed, so this step is only needed when
changing icons. `npm run build:style` works on its own.

`npm run sheets` renders side-by-side PNG sheets against CyclOSM into `.cache/sheets/`, without a
browser. It downloads many tiles on its first run.

### Releases

Pushes to `develop` publish the viewer and the style to GitHub Pages. They also release the npm
package with [semantic-release](https://semantic-release.gitbook.io): the version is derived from
the [Conventional Commits](https://www.conventionalcommits.org) since the last release (`fix:` is a
patch, `feat:` a minor), and nothing is released when there is neither.

## Licence

See [LICENSES.md](LICENSES.md) for licensing and attribution.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the version history.
