import * as repo from '#lib/server/repo.ts';
import { itemActions } from '#lib/server/actions.ts';
import { fromISO, todayISO, weekStart } from '#lib/dates.ts';
import { TODAY_LIMIT } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const today = todayISO();
	const picks = repo.todayPicks(today);
	const lastReview = repo.getSetting('last_review');
	const isSunday = fromISO(today).getDay() === 0;
	return {
		today,
		picks,
		overdue: repo.overdue(today),
		suggestions: picks.length < TODAY_LIMIT ? repo.suggestions(today) : [],
		habits: repo.habits(today),
		focus: repo.getSetting('week_focus'),
		reviewDue: isSunday && (!lastReview || lastReview < weekStart(today)),
		activity: repo.activity(),
		areas: repo.areaStats(today),
		doneWeek: repo.done(today).thisWeek,
		quote: repo.randomQuote(),
		quoteCount: repo.quotes().length
	};
};

export const actions = itemActions;
