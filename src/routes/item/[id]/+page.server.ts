import { error, fail, redirect } from '@sveltejs/kit';
import * as repo from '#lib/server/repo.ts';
import { itemActions, parseItem } from '#lib/server/actions.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const item = repo.getItem(Number(params.id));
	if (!item) error(404, 'Task not found');
	return {
		item,
		goals: repo.goalOptions(),
		steps: item.type === 'goal' ? repo.goalSteps(item.id) : []
	};
};

export const actions: Actions = {
	...itemActions,
	save: async ({ request, params }) => {
		const input = parseItem(await request.formData());
		if (!input.title) return fail(400, { message: 'Title cannot be empty.' });
		repo.saveItem(Number(params.id), input);
		return { message: 'Saved' };
	},
	remove: async ({ params }) => {
		repo.drop(Number(params.id));
		redirect(303, '/later');
	},
	addStep: async ({ request, params }) => {
		const title = String((await request.formData()).get('title') ?? '').trim();
		if (!title) return fail(400, { message: 'Write the step first.' });
		repo.addStep(Number(params.id), title);
	}
};
