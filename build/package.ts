import { cp, rm } from 'node:fs/promises';
import { writeStyles } from './style.ts';

/**
 * Builds the npm package into dist/: the four styles and the sprites. The styles point at the
 * sprite published on GitHub Pages; the copy in the package is there for self-hosting.
 */
const spriteUrl = process.env.SPRITE_URL ?? 'https://glandais.github.io/cycling-style/sprites/cyclo';

await rm('dist', { recursive: true, force: true });
await writeStyles('dist', spriteUrl);
await cp('public/sprites', 'dist/sprites', { recursive: true });
console.log(`Wrote the package to dist/ with sprite ${spriteUrl}`);
