import { json } from '@sveltejs/kit';
import { db } from '#lib/server/db.ts';
import type { RequestHandler } from './$types';

/** GET /api/health — used by the Docker healthcheck. */
export const GET: RequestHandler = () => {
	db.prepare('SELECT 1').get();
	return json({ ok: true, time: new Date().toString() });
};
