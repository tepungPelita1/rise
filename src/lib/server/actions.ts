import { fail, type Actions } from '@sveltejs/kit';
import * as repo from './repo.ts';
import { AREAS, type Area, type ItemType, type Repeat } from '#lib/types.ts';

const id = (f: FormData) => Number(f.get('id'));
const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const date = (f: FormData, k: string) => {
	const v = str(f, k);
	return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

export function parseItem(f: FormData): repo.ItemInput {
	const area = str(f, 'area');
	const type = str(f, 'type');
	const repeat = str(f, 'repeat');
	const goal = Number(f.get('goal_id'));
	return {
		title: str(f, 'title'),
		notes: str(f, 'notes'),
		area: (AREAS as readonly string[]).includes(area) ? (area as Area) : null,
		type: (['task', 'goal', 'habit'].includes(type) ? type : 'task') as ItemType,
		due: date(f, 'due'),
		do_date: date(f, 'do_date'),
		repeat: (['none', 'daily', 'weekly', 'monthly'].includes(repeat) ? repeat : 'none') as Repeat,
		goal_id: goal > 0 ? goal : null
	};
}

/** Small actions every list screen shares. */
export const itemActions: Actions = {
	done: async ({ request }) => {
		repo.complete(id(await request.formData()));
	},
	reopen: async ({ request }) => {
		repo.reopen(id(await request.formData()));
	},
	drop: async ({ request }) => {
		repo.drop(id(await request.formData()));
	},
	restore: async ({ request }) => {
		repo.restore(id(await request.formData()));
	},
	move: async ({ request }) => {
		const f = await request.formData();
		repo.moveStep(id(f), f.get('dir') === 'up' ? -1 : 1);
	},
	pick: async ({ request }) => {
		if (!repo.pickToday(id(await request.formData()))) {
			return fail(400, { message: 'Today is full (max 3). Finish or remove one first.' });
		}
	},
	unpick: async ({ request }) => {
		repo.unpick(id(await request.formData()));
	},
	newDate: async ({ request }) => {
		const f = await request.formData();
		const d = date(f, 'due');
		if (!d) return fail(400, { message: 'Pick a date first.' });
		repo.setDue(id(f), d);
	},
	habit: async ({ request }) => {
		repo.toggleHabit(id(await request.formData()));
	}
};
