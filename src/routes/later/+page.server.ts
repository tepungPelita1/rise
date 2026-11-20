import * as repo from '#lib/server/repo.ts';
import { itemActions } from '#lib/server/actions.ts';
import { TODAY_LIMIT } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	...repo.later(),
	todayFull: repo.todayPicks().length >= TODAY_LIMIT,
	droppedCount: repo.droppedCount()
});

export const actions = itemActions;
