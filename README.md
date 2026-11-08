# cycling-style

A MapLibre style for [VersaTiles](https://versatiles.org) vector tiles (Shortbread 1.1) inspired by
[CyclOSM](https://www.cyclosm.org), with a small site comparing both maps side by side.

```sh
npm install
npm run build   # generates public/style.json and the sprites
npm run dev     # opens the comparison site
npm test
```

The style only uses data available in Shortbread 1.1. On-road cycle lanes, cycle routes and
cycleways below zoom 13 are not part of that schema and are therefore not drawn.
