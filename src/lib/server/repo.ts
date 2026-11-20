import { db } from './db.ts';
import { addDays, addMonths, todayISO, weekStart } from '#lib/dates.ts';
import {
	AREAS,
	TODAY_LIMIT,
	type Area,
	type GoalView,
	type Habit,
	type Item,
	type ItemType,
	type Repeat
} from '#lib/types.ts';

type Row = Record<string, unknown>;
const rows = <T>(sql: string, ...p: (string | number | null)[]) =>
	db.prepare(sql).all(...p) as unknown as T[];
const row = <T>(sql: string, ...p: (string | number | null)[]) =>
	db.prepare(sql).get(...p) as unknown as T | undefined;
const run = (sql: string, ...p: (string | number | null)[]) => db.prepare(sql).run(...p);

const SELECT = `
	SELECT i.*, g.title AS goal_title
	FROM items i LEFT JOIN items g ON g.id = i.goal_id`;

/** A task is "actionable" when it has no goal, or it is the goal's next step. */
const ACTIONABLE = `
	(i.goal_id IS NULL OR (
		g.status = 'open' AND i.id = (
			SELECT c.id FROM items c
			WHERE c.goal_id = i.goal_id AND c.status = 'open' AND c.type = 'task'
			ORDER BY c.position, c.id LIMIT 1)))`;

const DATE_KEY = `MIN(COALESCE(i.due, '9999-12-31'), COALESCE(i.do_date, '9999-12-31'))`;

// ---------- reads ----------

export function getItem(id: number) {
	return row<Item>(`${SELECT} WHERE i.id = ?`, id);
}

export function inbox() {
	return rows<Item>(`${SELECT} WHERE i.status = 'inbox' ORDER BY i.id DESC`);
}

export function inboxCount() {
	return row<{ n: number }>(`SELECT COUNT(*) n FROM items WHERE status = 'inbox'`)!.n;
}

export function todayPicks(today = todayISO()) {
	return rows<Item>(
		`${SELECT} WHERE i.type = 'task' AND i.status = 'open' AND i.today_date = ?
		 ORDER BY ${DATE_KEY}, i.id`,
		today
	);
}

export function overdue(today = todayISO()) {
	return rows<Item>(
		`${SELECT} WHERE i.type = 'task' AND i.status = 'open' AND i.due < ?
		 AND COALESCE(i.today_date, '') <> ? ORDER BY i.due, i.id`,
		today,
		today
	);
}

/** Best next tasks: nearest due date first, then planned do dates. */
export function suggestions(today = todayISO(), limit = 5) {
	return rows<Item>(
		`${SELECT} WHERE i.type = 'task' AND i.status = 'open'
		 AND COALESCE(i.today_date, '') <> ?
		 AND (i.due IS NULL OR i.due >= ?)
		 AND (i.do_date IS NULL OR i.do_date <= ? OR i.due IS NOT NULL)
		 AND ${ACTIONABLE}
		 ORDER BY
			CASE WHEN i.do_date <= ? THEN 0 WHEN i.due IS NOT NULL THEN 1 WHEN i.do_date IS NOT NULL THEN 2 ELSE 3 END,
			i.due, i.do_date, i.position, i.id
		 LIMIT ?`,
		today,
		today,
		addDays(today, 7),
		today,
		limit
	);
}

export function later(today = todayISO()) {
	const list = rows<Item>(
		`${SELECT} WHERE i.type = 'task' AND i.status = 'open'
		 AND COALESCE(i.today_date, '') <> ? AND ${ACTIONABLE}
		 ORDER BY ${DATE_KEY}, i.id`,
		today
	);
	const groups = AREAS.map((area) => ({ area, items: list.filter((t) => t.area === area) }));
	return { groups, noArea: list.filter((t) => !t.area) };
}

export function goals(): GoalView[] {
	const list = rows<Item>(`${SELECT} WHERE i.type = 'goal' AND i.status = 'open' ORDER BY i.area, i.id`);
	return list.map((g) => {
		const next =
			row<Item>(
				`${SELECT} WHERE i.goal_id = ? AND i.status = 'open' AND i.type = 'task'
				 ORDER BY i.position, i.id LIMIT 1`,
				g.id
			) ?? null;
		const c = row<{ open: number; done: number }>(
			`SELECT SUM(status = 'open') open, SUM(status = 'done') done FROM items WHERE goal_id = ?`,
			g.id
		)!;
		return {
			...g,
			next,
			steps: goalSteps(g.id),
			open_count: c.open ?? 0,
			done_count: c.done ?? 0
		};
	});
}

/** Things finished per day (tasks + habit ticks), for the heatmap. */
export function activity(days = 371, today = todayISO()) {
	const from = addDays(today, -days);
	const map: Record<string, number> = {};
	for (const r of rows<{ d: string; n: number }>(
		`SELECT substr(done_at, 1, 10) d, COUNT(*) n FROM items
		 WHERE status = 'done' AND done_at >= ? GROUP BY d`,
		from
	))
		map[r.d] = (map[r.d] ?? 0) + r.n;
	for (const r of rows<{ d: string; n: number }>(
		`SELECT date d, COUNT(*) n FROM habit_log WHERE date >= ? GROUP BY date`,
		from
	))
		map[r.d] = (map[r.d] ?? 0) + r.n;
	return map;
}

/** Per area: open tasks and tasks done this week. */
export function areaStats(today = todayISO()) {
	const start = weekStart(today);
	const r = rows<{ area: Area; open: number; week: number }>(
		`SELECT area,
			SUM(status = 'open') open,
			SUM(status = 'done' AND substr(done_at, 1, 10) >= ?) week
		 FROM items WHERE type = 'task' AND area IS NOT NULL GROUP BY area`,
		start
	);
	return AREAS.map((area) => r.find((x) => x.area === area) ?? { area, open: 0, week: 0 });
}

export function goalSteps(goalId: number) {
	return rows<Item>(
		`${SELECT} WHERE i.goal_id = ? AND i.status IN ('open','done') ORDER BY i.status = 'done' DESC, i.position, i.id`,
		goalId
	);
}

export function goalOptions() {
	return rows<{ id: number; title: string; area: Area | null }>(
		`SELECT id, title, area FROM items WHERE type = 'goal' AND status = 'open' ORDER BY title`
	);
}

export function habits(today = todayISO()): Habit[] {
	const list = rows<Item>(`${SELECT} WHERE i.type = 'habit' AND i.status = 'open' ORDER BY i.id`);
	return list.map((h) => {
		const dates = new Set(
			rows<{ date: string }>(`SELECT date FROM habit_log WHERE habit_id = ?`, h.id).map((r) => r.date)
		);
		const done_today = dates.has(today);
		let day = done_today ? today : addDays(today, -1);
		let streak = 0;
		while (dates.has(day)) {
			streak++;
			day = addDays(day, -1);
		}
		return { ...h, done_today, streak };
	});
}

export function done(today = todayISO()) {
	const list = rows<Item>(
		`${SELECT} WHERE i.status = 'done' AND i.type <> 'habit' ORDER BY i.done_at DESC LIMIT 200`
	);
	const start = weekStart(today);
	const thisWeek = list.filter((t) => t.done_at && t.done_at.slice(0, 10) >= start).length;
	return { list, thisWeek };
}

export function goalsWithoutNextStep() {
	return goals().filter((g) => !g.next);
}

export function getSetting(key: string) {
	return row<{ value: string }>(`SELECT value FROM settings WHERE key = ?`, key)?.value ?? null;
}

export function setSetting(key: string, value: string) {
	run(
		`INSERT INTO settings (key, value) VALUES (?, ?)
		 ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
		key,
		value
	);
}

// ---------- writes ----------

export function capture(title: string) {
	run(`INSERT INTO items (title, status) VALUES (?, 'inbox')`, title);
}

export interface ItemInput {
	title: string;
	notes: string;
	area: Area | null;
	type: ItemType;
	due: string | null;
	do_date: string | null;
	repeat: Repeat;
	goal_id: number | null;
}

export function saveItem(id: number, f: ItemInput) {
	// A goal or habit can't sit inside another goal.
	const goalId = f.type === 'task' ? f.goal_id : null;
	const pos = goalId
		? (row<{ p: number }>(`SELECT COALESCE(MAX(position), 0) + 1 p FROM items WHERE goal_id = ? AND id <> ?`, goalId, id)!.p)
		: 0;
	const current = getItem(id);
	const keepPos = current && current.goal_id === goalId ? current.position : pos;
	run(
		`UPDATE items SET title = ?, notes = ?, area = ?, type = ?, due = ?, do_date = ?,
		 repeat = ?, goal_id = ?, position = ?,
		 status = CASE WHEN status = 'inbox' THEN 'open' ELSE status END
		 WHERE id = ?`,
		f.title,
		f.notes,
		f.area,
		f.type,
		f.due,
		f.do_date,
		f.type === 'habit' ? 'daily' : f.repeat,
		goalId,
		keepPos,
		id
	);
}

export function addStep(goalId: number, title: string) {
	const g = getItem(goalId);
	if (!g) return;
	const p = row<{ p: number }>(`SELECT COALESCE(MAX(position), 0) + 1 p FROM items WHERE goal_id = ?`, goalId)!.p;
	run(
		`INSERT INTO items (title, area, type, status, goal_id, position) VALUES (?, ?, 'task', 'open', ?, ?)`,
		title,
		g.area,
		goalId,
		p
	);
}

export function addGoal(title: string, area: Area | null, firstStep: string) {
	const id = Number(
		run(`INSERT INTO items (title, area, type, status) VALUES (?, ?, 'goal', 'open')`, title, area)
			.lastInsertRowid
	);
	if (firstStep) addStep(id, firstStep);
}

/** Returns false when Today is already full. */
export function pickToday(id: number, today = todayISO()) {
	const n = todayPicks(today).length;
	if (n >= TODAY_LIMIT) return false;
	run(`UPDATE items SET today_date = ? WHERE id = ?`, today, id);
	return true;
}

export function unpick(id: number) {
	run(`UPDATE items SET today_date = NULL WHERE id = ?`, id);
}

function shift(date: string, r: Repeat) {
	if (r === 'daily') return addDays(date, 1);
	if (r === 'weekly') return addDays(date, 7);
	return addMonths(date, 1);
}

function nextDate(date: string | null, r: Repeat, today: string) {
	if (!date) return null;
	let d = shift(date, r);
	while (d <= today) d = shift(d, r);
	return d;
}

export function complete(id: number, today = todayISO()) {
	const t = getItem(id);
	if (!t || t.status === 'done') return;
	db.exec('BEGIN');
	try {
		run(`UPDATE items SET status = 'done', done_at = datetime('now','localtime') WHERE id = ?`, id);
		if (t.type === 'task' && t.repeat !== 'none') {
			let due = nextDate(t.due, t.repeat, today);
			let doDate = nextDate(t.do_date, t.repeat, today);
			if (!due && !doDate) doDate = shift(today, t.repeat);
			run(
				`INSERT INTO items (title, notes, area, type, status, due, do_date, repeat, goal_id, position)
				 VALUES (?, ?, ?, 'task', 'open', ?, ?, ?, ?, ?)`,
				t.title,
				t.notes,
				t.area,
				due,
				doDate,
				t.repeat,
				t.goal_id,
				t.position
			);
		}
		db.exec('COMMIT');
	} catch (e) {
		db.exec('ROLLBACK');
		throw e;
	}
}

export function reopen(id: number) {
	run(`UPDATE items SET status = 'open', done_at = NULL, today_date = NULL WHERE id = ?`, id);
}

export function drop(id: number) {
	run(`UPDATE items SET status = 'dropped', today_date = NULL WHERE id = ?`, id);
}

export function setDue(id: number, due: string) {
	run(`UPDATE items SET due = ? WHERE id = ?`, due, id);
}

export function toggleHabit(id: number, today = todayISO()) {
	const has = row<Row>(`SELECT 1 FROM habit_log WHERE habit_id = ? AND date = ?`, id, today);
	if (has) run(`DELETE FROM habit_log WHERE habit_id = ? AND date = ?`, id, today);
	else run(`INSERT INTO habit_log (habit_id, date) VALUES (?, ?)`, id, today);
}

// ---------- quotes ----------

export interface Quote {
	id: number;
	text: string;
}

export function quotes() {
	return rows<Quote>(`SELECT id, text FROM quotes ORDER BY id DESC`);
}

/** A random quote, avoiding `notId` when there is more than one. */
export function randomQuote(notId?: number) {
	return (
		row<Quote>(
			`SELECT id, text FROM quotes WHERE id <> ? ORDER BY RANDOM() LIMIT 1`,
			notId ?? -1
		) ?? row<Quote>(`SELECT id, text FROM quotes ORDER BY RANDOM() LIMIT 1`) ?? null
	);
}

export function addQuote(text: string) {
	run(`INSERT INTO quotes (text) VALUES (?)`, text);
}

export function updateQuote(id: number, text: string) {
	run(`UPDATE quotes SET text = ? WHERE id = ?`, text, id);
}

export function deleteQuote(id: number) {
	run(`DELETE FROM quotes WHERE id = ?`, id);
}

// ---------- bin (dropped items) ----------

export function dropped() {
	return rows<Item>(`${SELECT} WHERE i.status = 'dropped' ORDER BY i.id DESC LIMIT 300`);
}

export function droppedCount() {
	return row<{ n: number }>(`SELECT COUNT(*) n FROM items WHERE status = 'dropped'`)!.n;
}

/** Bring a dropped (or done) item back to the open list. */
export function restore(id: number) {
	// items that were never sorted (no area) go back to the Inbox
	run(
		`UPDATE items SET status = CASE WHEN area IS NULL THEN 'inbox' ELSE 'open' END,
		 done_at = NULL, today_date = NULL
		 WHERE id = ? AND status IN ('dropped', 'done')`,
		id
	);
}

// ---------- goal steps order ----------

/** Move an open step one place up (-1) or down (+1) inside its goal. */
export function moveStep(id: number, dir: -1 | 1) {
	const s = getItem(id);
	if (!s?.goal_id || s.status !== 'open') return;
	const list = rows<{ id: number }>(
		`SELECT id FROM items WHERE goal_id = ? AND status = 'open' AND type = 'task'
		 ORDER BY position, id`,
		s.goal_id
	).map((r) => r.id);
	const i = list.indexOf(id);
	const j = i + dir;
	if (i < 0 || j < 0 || j >= list.length) return;
	[list[i], list[j]] = [list[j], list[i]];
	// done steps keep their spot before the open ones
	const base = row<{ p: number }>(
		`SELECT COALESCE(MAX(position), 0) p FROM items WHERE goal_id = ? AND status = 'done'`,
		s.goal_id
	)!.p;
	db.exec('BEGIN');
	try {
		list.forEach((sid, k) => run(`UPDATE items SET position = ? WHERE id = ?`, base + k + 1, sid));
		db.exec('COMMIT');
	} catch (e) {
		db.exec('ROLLBACK');
		throw e;
	}
}
