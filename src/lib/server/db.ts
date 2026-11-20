import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, renameSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { seed } from './seed.ts';

const DB_PATH = resolve(process.env.RISE_DB ?? 'data/rise.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

// One-time move from the old name (TaskHQ → Rise).
const OLD = resolve(dirname(DB_PATH), 'taskhq.db');
if (!existsSync(DB_PATH) && existsSync(OLD)) {
	for (const ext of ['', '-wal', '-shm']) {
		if (existsSync(OLD + ext)) renameSync(OLD + ext, DB_PATH + ext);
	}
}

export const db = new DatabaseSync(DB_PATH);

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 3000;

CREATE TABLE IF NOT EXISTS items (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	title       TEXT NOT NULL,
	notes       TEXT NOT NULL DEFAULT '',
	area        TEXT CHECK (area IN ('study','build','life','self')),
	type        TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('task','goal','habit')),
	status      TEXT NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox','open','done','dropped')),
	due         TEXT,
	do_date     TEXT,
	repeat      TEXT NOT NULL DEFAULT 'none' CHECK (repeat IN ('none','daily','weekly','monthly')),
	goal_id     INTEGER REFERENCES items(id) ON DELETE SET NULL,
	position    INTEGER NOT NULL DEFAULT 0,
	today_date  TEXT,
	created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
	done_at     TEXT
);

CREATE INDEX IF NOT EXISTS items_status ON items(status, type);
CREATE INDEX IF NOT EXISTS items_goal ON items(goal_id);

CREATE TABLE IF NOT EXISTS habit_log (
	habit_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
	date     TEXT NOT NULL,
	PRIMARY KEY (habit_id, date)
);

CREATE TABLE IF NOT EXISTS settings (
	key   TEXT PRIMARY KEY,
	value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quotes (
	id         INTEGER PRIMARY KEY AUTOINCREMENT,
	text       TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
`);

const count = db.prepare('SELECT COUNT(*) AS n FROM items').get() as { n: number };
if (count.n === 0) seed(db);

// First quote, added once (if you delete it later it stays deleted).
const seeded = db.prepare(`SELECT 1 FROM settings WHERE key = 'quotes_seeded'`).get();
if (!seeded) {
	db.prepare(`INSERT INTO quotes (text) VALUES (?)`).run('the more you larp the less you less larp');
	db.prepare(`INSERT INTO settings (key, value) VALUES ('quotes_seeded', '1')`).run();
}
