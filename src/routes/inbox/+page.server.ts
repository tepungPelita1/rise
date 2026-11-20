import { fail } from '@sveltejs/kit';
import * as repo from '#lib/server/repo.ts';
import { itemActions, parseItem } from '#lib/server/actions.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	items: repo.inbox(),
	goals: repo.goalOptions()
});

export const actions: Actions = {
	...itemActions,
	add: async ({ request }) => {
		const title = String((await request.formData()).get('title') ?? '').trim();
		if (!title) return fail(400, { message: 'Write something first.' });
		repo.capture(title.slice(0, 300));
		return { added: true };
	},
	sort: async ({ request }) => {
		const f = await request.formData();
		const input = parseItem(f);
		if (!input.title) return fail(400, { message: 'Title cannot be empty.' });
		if (!input.area) return fail(400, { message: 'Pick an area first.' });
		repo.saveItem(Number(f.get('id')), input);
		if (input.type === 'goal' && String(f.get('first_step') ?? '').trim()) {
			repo.addStep(Number(f.get('id')), String(f.get('first_step')).trim());
		}
	}
};
