import { fail, redirect } from '@sveltejs/kit';
import { isValidPinFormat, verifyPin } from '#lib/server/lock.ts';
import { clearUnlocked, config, isHttps, limiter, safeNext, setUnlocked } from '#lib/server/gate.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const s = limiter.status(Date.now());
	return { configured: config.configured, retryAt: s.locked ? s.retryAt : null };
};

export const actions: Actions = {
	unlock: async ({ request, cookies, url }) => {
		if (!config.configured) return fail(503, { message: 'PIN not set up on the server yet.' });

		const now = Date.now();
		const before = limiter.status(now);
		if (before.locked) return fail(429, { message: 'Too many tries.', retryAt: before.retryAt });

		const form = await request.formData();
		const pin = String(form.get('pin') ?? '');
		if (!isValidPinFormat(pin)) return fail(400, { message: 'PIN is 4 digits.' });

		if (!verifyPin(pin, config.hash!)) {
			limiter.fail(now);
			const after = limiter.status(now);
			return after.locked
				? fail(429, { message: 'Too many tries.', retryAt: after.retryAt })
				: fail(401, { message: 'Wrong PIN.' });
		}

		limiter.reset();
		setUnlocked(cookies, form.get('remember') === 'on', isHttps(request));
		const next = safeNext(url.searchParams.get('next'));
		// with JS the page plays the unlock animation, then navigates itself
		if (request.headers.get('x-sveltekit-action') === 'true') return { ok: true, next };
		redirect(303, next);
	},

	lock: async ({ request, cookies }) => {
		clearUnlocked(cookies, isHttps(request));
		redirect(303, '/unlock');
	}
};
