export const AREAS = ['study', 'build', 'life', 'self'] as const;
export type Area = (typeof AREAS)[number];

export const AREA_LABEL: Record<Area, string> = {
	study: 'Study',
	build: 'Build',
	life: 'Life Admin',
	self: 'Self'
};

export type ItemType = 'task' | 'goal' | 'habit';
export type Status = 'inbox' | 'open' | 'done' | 'dropped';
export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly';

export const REPEAT_LABEL: Record<Repeat, string> = {
	none: 'No repeat',
	daily: 'Every day',
	weekly: 'Every week',
	monthly: 'Every month'
};

export interface Item {
	id: number;
	title: string;
	notes: string;
	area: Area | null;
	type: ItemType;
	status: Status;
	due: string | null;
	do_date: string | null;
	repeat: Repeat;
	goal_id: number | null;
	position: number;
	today_date: string | null;
	created_at: string;
	done_at: string | null;
	goal_title?: string | null;
}

export interface Habit extends Item {
	done_today: boolean;
	streak: number;
}

export interface GoalView extends Item {
	next: Item | null;
	steps: Item[];
	open_count: number;
	done_count: number;
}

export const TODAY_LIMIT = 3;
