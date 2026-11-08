import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import potpack from 'potpack';
import sharp from 'sharp';
import { darkColor } from './dark.ts';
import { ICONS, PATTERNS } from './sprite-manifest.ts';

const ICON_SIZE = 14;
const PADDING = 1;

/** Forces a single colour on an SVG, keeping `fill: none` shapes such as invisible canvases. */
function recolor(svg: string, color: string): string {
	return svg
		.replace(/\bfill="(?!none)[^"]*"/g, `fill="${color}"`)
		.replace(/\bfill:(?!none)[^;"]*/g, `fill:${color}`)
		.replace(/<svg\b/, `<svg fill="${color}"`);
}

/** Renders a pattern at its natural size, multiplied by the pixel ratio. */
async function renderPattern(source: string, ratio: 1 | 2): Promise<{ input: Buffer; width: number; height: number }> {
	let image = sharp(source, { density: 72 * ratio });
	if (source.endsWith('.png') && ratio > 1) {
		const { width, height } = await image.metadata();
		image = image.resize(width * ratio, height * ratio, { kernel: 'nearest' });
	}
	const { data, info } = await image.png().toBuffer({ resolveWithObject: true });
	return { input: data, width: info.width, height: info.height };
}

async function renderSheet(ratio: 1 | 2, dark: boolean): Promise<void> {
	const size = ICON_SIZE * ratio;
	const icons = await Promise.all(
		ICONS.map(async ({ name, source, color }) => {
			const svg = recolor(await readFile(source, 'utf8'), dark ? darkColor(color)! : color);
			// Rendered well above the target size, so that small icons are downscaled rather than blurred.
			const input = await sharp(Buffer.from(svg), { density: 72 * 16 })
				.resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
				.png()
				.toBuffer();
			return { name, input, width: size, height: size, w: size + 2 * PADDING, h: size + 2 * PADDING, x: 0, y: 0 };
		})
	);
	const patterns = await Promise.all(
		PATTERNS.map(async ({ name, source }) => {
			const { input, width, height } = await renderPattern(source, ratio);
			return { name, input, width, height, w: width + 2 * PADDING, h: height + 2 * PADDING, x: 0, y: 0 };
		})
	);
	const entries = [...icons, ...patterns];
	const { w, h } = potpack(entries);
	const suffix = `${dark ? '-dark' : ''}${ratio === 1 ? '' : '@2x'}`;
	const png = `public/sprites/cyclo${suffix}.png`;
	await sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
		.composite(entries.map(({ input, x, y }) => ({ input, left: x + PADDING, top: y + PADDING })))
		.png()
		.toFile(png);
	await promisify(execFile)('optipng', ['-quiet', '-o2', png]);
	const index = Object.fromEntries(
		entries.map(({ name, x, y, width, height }) => [name, { width, height, x: x + PADDING, y: y + PADDING, pixelRatio: ratio }])
	);
	await writeFile(`public/sprites/cyclo${suffix}.json`, JSON.stringify(index));
}

await mkdir('public/sprites', { recursive: true });
await Promise.all([renderSheet(1, false), renderSheet(2, false), renderSheet(1, true), renderSheet(2, true)]);
console.log(`Wrote ${ICONS.length} icons and ${PATTERNS.length} patterns to public/sprites`);
