import type { StyleSpecification } from 'maplibre-gl';

/** Loads a generated style and points its local sprite at this page's own location. */
export async function loadCyclingStyle(dark = false): Promise<StyleSpecification> {
	const style = (await (await fetch(dark ? 'style-dark.json' : 'style.json')).json()) as StyleSpecification;
	if (Array.isArray(style.sprite)) {
		style.sprite = style.sprite.map((sprite) =>
			sprite.id === 'cyclo' ? { ...sprite, url: new URL(dark ? 'sprites/cyclo-dark' : 'sprites/cyclo', location.href).href } : sprite
		);
	}
	return style;
}
