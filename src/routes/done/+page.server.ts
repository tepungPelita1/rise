import * as repo from '#lib/server/repo.ts';
import { itemActions } from '#lib/server/actions.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ ...repo.done(), activity: repo.activity() });

export const actions = itemActions;
