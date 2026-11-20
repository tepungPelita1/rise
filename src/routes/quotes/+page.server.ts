import { fail } from '@sveltejs/kit';
import * as repo from '#lib/server/repo.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ quotes: repo.quotes() });

const text = (f: FormData) => String(f.get('text') ?? '').trim().slice(0, 200);

export const actions: Actions = {
	add: async ({ request }) => {
		const t = text(await request.formData());
		if (!t) return fail(400, { message: 'Write a quote first.' });
		repo.addQuote(t);
	},
	save: async ({ request }) => {
		const f = await request.formData();
		const t = text(f);
		if (!t) return fail(400, { message: 'Quote cannot be empty.' });
		repo.updateQuote(Number(f.get('id')), t);
		return { message: 'Saved' };
	},
	remove: async ({ request }) => {
		repo.deleteQuote(Number((await request.formData()).get('id')));
	}
};
