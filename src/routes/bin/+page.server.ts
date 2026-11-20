import * as repo from '#lib/server/repo.ts';
import { itemActions } from '#lib/server/actions.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ items: repo.dropped() });

export const actions = itemActions;
