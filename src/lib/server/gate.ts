/**
 * Runtime glue for the PIN lock: one config + one limiter per server process,
 * and the cookie helpers used by hooks.server.ts and the /unlock actions.
 */
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/env';
import { COOKIE, REMEMBER_SECONDS, checkToken, createLimiter, lockConfig, makeToken } from './lock.ts';

export const config = lockConfig(process.env, dev);
/** global on purpose: attackers can rotate IPs. Resets on restart (deploys only). */
export const limiter = createLimiter();

const PUBLIC_EXACT = new Set([
	'/unlock',
	'/api/health',
	'/favicon.svg',
	'/manifest.webmanifest',
	'/apple-touch-icon.png',
	'/service-worker.js',
	'/robots.txt'
]);

export function isPublicPath(path: string) {
	return PUBLIC_EXACT.has(path) || path.startsWith('/_app/') || path.startsWith('/icon-');
}

export function isUnlocked(cookies: Cookies) {
	if (!config.enabled) return true;
	if (!config.configured || !config.secret) return false;
	return checkToken(cookies.get(COOKIE), config.secret);
}

/**
 * https only when a proxy in front says so (Cloudflare Tunnel / tailscale serve send
 * X-Forwarded-Proto). adapter-node reports https by default even for plain http, and a
 * Secure cookie would never stick on http://<tailscale-ip>:3020.
 */
export function isHttps(request: Request) {
	return request.headers.get('x-forwarded-proto') === 'https';
}

export function setUnlocked(cookies: Cookies, remember: boolean, secure: boolean) {
	cookies.set(COOKIE, makeToken(config.secret!), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		...(remember ? { maxAge: REMEMBER_SECONDS } : {})
	});
}

export function clearUnlocked(cookies: Cookies, secure: boolean) {
	cookies.delete(COOKIE, { path: '/', secure });
}

/** only same-site paths, never protocol-relative "//evil" */
export function safeNext(next: string | null) {
	return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/unlock')
		? next
		: '/';
}
