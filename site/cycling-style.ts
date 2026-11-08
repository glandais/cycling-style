import type { StyleSpecification } from 'maplibre-gl';

/** Loads the generated style and points the local sprite at this page's own location. */
export async function loadCyclingStyle(): Promise<StyleSpecification> {
	const style = (await (await fetch('style.json')).json()) as StyleSpecification;
	if (Array.isArray(style.sprite)) {
		style.sprite = style.sprite.map((sprite) =>
			sprite.id === 'cyclo' ? { ...sprite, url: new URL('sprites/cyclo', location.href).href } : sprite
		);
	}
	return style;
}
