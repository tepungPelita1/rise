import { fail } from '@sveltejs/kit';
import * as repo from '#lib/server/repo.ts';
import { todayISO } from '#lib/dates.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	inboxCount: repo.inboxCount(),
	missing: repo.goalsWithoutNextStep(),
	focus: repo.getSetting('week_focus') ?? '',
	lastReview: repo.getSetting('last_review'),
	doneWeek: repo.done().thisWeek
});

export const actions: Actions = {
	addStep: async ({ request }) => {
		const f = await request.formData();
		const title = String(f.get('title') ?? '').trim();
		if (!title) return fail(400, { message: 'Write the next step first.' });
		repo.addStep(Number(f.get('goal_id')), title);
	},
	finish: async ({ request }) => {
		const f = await request.formData();
		repo.setSetting('week_focus', String(f.get('focus') ?? '').trim().slice(0, 140));
		repo.setSetting('last_review', todayISO());
		return { finished: true, message: 'Week Review saved. Have a good week!' };
	}
};
