import * as repo from '#lib/server/repo.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => ({
	inboxCount: repo.inboxCount()
});
