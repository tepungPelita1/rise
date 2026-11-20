import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter(),

			// The built-in CSRF check only allows one origin. Rise is reached via two
			// (Tailscale IP over http + MagicDNS over https), so the check is done in
			// src/hooks.server.ts with the RISE_ORIGINS allowlist instead.
			csrf: { trustedOrigins: ['*'] }
		})
	]
});
