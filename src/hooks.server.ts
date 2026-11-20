import type { Handle } from '@sveltejs/kit/hooks';
import { dev } from '$app/env';

/**
 * CSRF protection with an allowlist, so Rise works from more than one address
 * (e.g. a LAN/VPN IP over http AND a hostname over https).
 * SvelteKit's built-in check only allows a single origin, so it is turned off in
 * vite.config.ts and replaced by this.
 *
 * RISE_ORIGINS="http://192.0.2.10:3020,https://rise.example.com"
 */
const ALLOWED = new Set(
	(process.env.RISE_ORIGINS ?? '')
		.split(',')
		.map((s) => s.trim().replace(/\/$/, ''))
		.filter(Boolean)
);

const FORM_TYPES = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function allowed(origin: string | null, host: string | null) {
	if (!origin) return false;
	if (ALLOWED.has(origin)) return true;
	if (dev) {
		// local development: same host is fine
		try {
			return new URL(origin).host === host;
		} catch {
			return false;
		}
	}
	return false;
}

export const handle: Handle = async ({ event, resolve }) => {
	const { request } = event;
	if (UNSAFE.has(request.method)) {
		const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
		if (FORM_TYPES.includes(type) || type === '') {
			const origin = request.headers.get('origin');
			if (!allowed(origin, request.headers.get('host'))) {
				const msg = `Blocked: ${origin ?? 'no origin'} is not in RISE_ORIGINS`;
				return request.headers.get('accept')?.includes('application/json')
					? new Response(JSON.stringify({ message: msg }), {
							status: 403,
							headers: { 'content-type': 'application/json' }
						})
					: new Response(msg, { status: 403 });
			}
		}
	}
	return resolve(event);
};
