import { fail } from '@sveltejs/kit';
import * as repo from '#lib/server/repo.ts';
import { itemActions } from '#lib/server/actions.ts';
import { AREAS, TODAY_LIMIT, type Area } from '#lib/types.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	goals: repo.goals(),
	todayFull: repo.todayPicks().length >= TODAY_LIMIT
});

export const actions: Actions = {
	...itemActions,
	addStep: async ({ request }) => {
		const f = await request.formData();
		const title = String(f.get('title') ?? '').trim();
		if (!title) return fail(400, { message: 'Write the next step first.' });
		repo.addStep(Number(f.get('goal_id')), title);
	},
	addGoal: async ({ request }) => {
		const f = await request.formData();
		const title = String(f.get('title') ?? '').trim();
		const step = String(f.get('first_step') ?? '').trim();
		const area = String(f.get('area') ?? '');
		if (!title || !step) return fail(400, { message: 'A goal needs a name and a first step.' });
		repo.addGoal(title, (AREAS as readonly string[]).includes(area) ? (area as Area) : null, step);
		return { goalAdded: true };
	}
};
