import { json } from '@sveltejs/kit';
import * as repo from '#lib/server/repo.ts';
import type { RequestHandler } from './$types';

/** GET /api/quote?not=<id> → another random quote */
export const GET: RequestHandler = ({ url }) => {
	const not = Number(url.searchParams.get('not')) || undefined;
	return json(repo.randomQuote(not));
};
