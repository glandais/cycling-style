import { defineConfig } from 'vite';

// Relative base so the site can be deployed under any sub-path.
export default defineConfig({
	root: 'site',
	base: './',
	publicDir: '../public',
	build: { outDir: '../dist', emptyOutDir: true },
});
