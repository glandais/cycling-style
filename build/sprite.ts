import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import potpack from 'potpack';
import sharp from 'sharp';
import { ICONS } from './sprite-manifest.ts';

const ICON_SIZE = 14;
const PADDING = 1;

/** Forces a single colour on an SVG, keeping `fill: none` shapes such as invisible canvases. */
function recolor(svg: string, color: string): string {
	return svg
		.replace(/\bfill="(?!none)[^"]*"/g, `fill="${color}"`)
		.replace(/\bfill:(?!none)[^;"]*/g, `fill:${color}`)
		.replace(/<svg\b/, `<svg fill="${color}"`);
}

async function renderSheet(ratio: 1 | 2): Promise<void> {
	const size = ICON_SIZE * ratio;
	const icons = await Promise.all(
		ICONS.map(async ({ name, source, color }) => {
			const svg = recolor(await readFile(source, 'utf8'), color);
			// Rendered well above the target size, so that small icons are downscaled rather than blurred.
			const input = await sharp(Buffer.from(svg), { density: 72 * 16 })
				.resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
				.png()
				.toBuffer();
			return { name, input, w: size + 2 * PADDING, h: size + 2 * PADDING, x: 0, y: 0 };
		})
	);
	const { w, h } = potpack(icons);
	const suffix = ratio === 1 ? '' : '@2x';
	const png = `public/sprites/cyclo${suffix}.png`;
	await sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
		.composite(icons.map(({ input, x, y }) => ({ input, left: x + PADDING, top: y + PADDING })))
		.png()
		.toFile(png);
	await promisify(execFile)('optipng', ['-quiet', '-o2', png]);
	const index = Object.fromEntries(
		icons.map(({ name, x, y }) => [name, { width: size, height: size, x: x + PADDING, y: y + PADDING, pixelRatio: ratio }])
	);
	await writeFile(`public/sprites/cyclo${suffix}.json`, JSON.stringify(index));
}

await mkdir('public/sprites', { recursive: true });
await Promise.all([renderSheet(1), renderSheet(2)]);
console.log(`Wrote ${ICONS.length} icons to public/sprites`);
