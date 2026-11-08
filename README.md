# cycling-style

A MapLibre style for [VersaTiles](https://versatiles.org) vector tiles (Shortbread 1.1) inspired by
[CyclOSM](https://www.cyclosm.org), with a small site comparing both maps side by side.

```sh
npm install
npm run build   # generates public/style.json and the sprites
npm run dev     # opens the comparison site
npm test
```

`npm run build:sprite` reads icons from the reference repositories in `ref/`. The generated files
in `public/` are committed, so this step is only needed when changing icons.

`npm run sheets` renders side-by-side PNG sheets into `.cache/sheets/`, without a browser.

To use `style.json` outside the comparison site, publish `public/sprites/` and build the style with
the absolute URL of the sprite, without extension:

```sh
SPRITE_URL=https://example.org/sprites/cyclo npm run build:style
```

The style only uses data available in Shortbread 1.1. On-road cycle lanes, cycle routes and
cycleways below zoom 13 are not part of that schema and are therefore not drawn.

Paths whose `bicycle` value is `yes` are drawn as shared cycleways. Shortbread merges
`bicycle=designated` into `yes`, so some paths that merely allow bicycles appear in that colour.

See [LICENSES.md](LICENSES.md) for licensing and attribution.
