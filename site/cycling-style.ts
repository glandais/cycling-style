import type { StyleSpecification } from 'maplibre-gl';

/** Loads a generated style and points its local sprite at this page's own location. */
export async function loadCyclingStyle(name = 'cycling-style'): Promise<StyleSpecification> {
	const dark = name.endsWith('-dark');
	// Variant names map to files: cycling-style-road-dark is style-road-dark.json.
	const style = (await (await fetch(`${name.replace(/^cycling-/, '')}.json`)).json()) as StyleSpecification;
	if (Array.isArray(style.sprite)) {
		style.sprite = style.sprite.map((sprite) =>
			sprite.id === 'cyclo' ? { ...sprite, url: new URL(dark ? 'sprites/cyclo-dark' : 'sprites/cyclo', location.href).href } : sprite
		);
	}
	return style;
}
