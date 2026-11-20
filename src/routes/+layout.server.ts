import * as repo from '#lib/server/repo.ts';
import { config } from '#lib/server/gate.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	// never touch task data for a locked visitor (the lock screen shares this layout)
	inboxCount: locals.unlocked ? repo.inboxCount() : 0,
	unlocked: locals.unlocked,
	lockEnabled: config.enabled
});
