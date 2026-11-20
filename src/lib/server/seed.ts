import type { DatabaseSync } from 'node:sqlite';
import type { Area, Repeat } from '#lib/types.ts';

/**
 * Your brain dump from 20 Nov 2026 (28 items + Coursera), sorted into
 * Task / Goal / Habit and the 4 areas. Vague learning items became Goals
 * with one small first step.
 */

interface T {
	title: string;
	notes?: string;
	due?: string;
	do?: string;
	repeat?: Repeat;
}

interface G {
	title: string;
	notes?: string;
	steps: T[];
}

const tasks: Record<Area, T[]> = {
	study: [
		{ title: 'CSP', due: '2026-11-23' },
		{ title: 'Arab Chapter 5', due: '2026-11-25' },
		{ title: 'Network Case Study 2', due: '2026-11-25' }
	],
	life: [
		{ title: 'Bersihkan longgokan sampah belakang rumah', do: '2026-11-21' },
		{ title: 'Buang sampah botol', do: '2026-11-21', repeat: 'weekly' },
		{ title: 'Kemas rumah sewa', do: '2026-11-22', repeat: 'weekly' },
		{ title: 'Kemas kawasan luar rumah', do: '2026-11-22', repeat: 'weekly' },
		{ title: 'Semak akaun student adik yang sudah penuh', do: '2026-11-22' },
		{ title: 'Coursera – settle email', notes: 'Rakyat Digital' },
		{ title: 'Setup / register warranty earphone Sony' }
	],
	build: [],
	self: []
};

const goals: Record<Area, G[]> = {
	build: [
		{
			title: 'Hermes AI agent ecosystem',
			notes:
				'Goal: build an AI agent ecosystem that helps with FYP work, proposal, research and technical tasks.',
			steps: [
				{ title: 'Setup Hermes semula dan reconfigure' },
				{ title: 'Setup Hermes + Claude untuk bantu proposal FYP (CSP)' },
				{ title: 'Setup Hermes Agent di Telegram' },
				{ title: 'Configure multi-bot architecture dalam Telegram' },
				{ title: 'Asingkan role dan tanggungjawab setiap bot' }
			]
		},
		{
			title: 'Belajar Git & GitHub',
			steps: [
				{ title: 'Belajar Git – watch one basics tutorial (30 min)' },
				{ title: 'Belajar GitHub – push your first repo' }
			]
		},
		{
			title: 'DeepSeek setup',
			steps: [{ title: 'Beli DeepSeek API key' }, { title: 'Setup DeepSeek harness' }]
		},
		{
			title: 'Belajar editing menggunakan Claude',
			steps: [{ title: 'Try one editing session with Claude (30 min)' }]
		},
		{
			title: 'Belajar cybersecurity / security',
			steps: [{ title: 'Pick one beginner roadmap or course' }]
		},
		{
			title: 'Mula projek Laravel Backend',
			steps: [{ title: 'Create an empty Laravel project and run it' }]
		}
	],
	self: [
		{
			title: 'Road to Sado',
			notes: 'Goal: understand body, nutrition and protein, then build the body step by step.',
			steps: [
				{ title: 'Fahamkan body composition' },
				{ title: 'Fahamkan pemakanan' },
				{ title: 'Kaji keperluan protein' },
				{ title: 'Beli protein supplement (if needed)' }
			]
		},
		{
			title: 'Fahamkan solat & wudhu',
			steps: [{ title: 'Fahamkan wudhu' }, { title: 'Fahamkan solat' }]
		}
	],
	study: [],
	life: []
};

const habits: { title: string; area: Area }[] = [{ title: 'Membaca buku', area: 'self' }];

export function seed(db: DatabaseSync) {
	const insert = db.prepare(
		`INSERT INTO items (title, notes, area, type, status, due, do_date, repeat, goal_id, position)
		 VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)`
	);
	const add = (area: Area, type: string, t: T, goalId: number | null = null, pos = 0) =>
		Number(
			insert.run(
				t.title,
				t.notes ?? '',
				area,
				type,
				t.due ?? null,
				t.do ?? null,
				t.repeat ?? 'none',
				goalId,
				pos
			).lastInsertRowid
		);

	db.exec('BEGIN');
	try {
		for (const [area, list] of Object.entries(tasks) as [Area, T[]][]) {
			for (const t of list) add(area, 'task', t);
		}
		for (const [area, list] of Object.entries(goals) as [Area, G[]][]) {
			for (const g of list) {
				const id = add(area, 'goal', g);
				g.steps.forEach((s, i) => add(area, 'task', s, id, i + 1));
			}
		}
		for (const h of habits) add(h.area, 'habit', { title: h.title, repeat: 'daily' });
		db.exec('COMMIT');
	} catch (e) {
		db.exec('ROLLBACK');
		throw e;
	}
}
