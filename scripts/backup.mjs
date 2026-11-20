// Safe online backup of the Rise database (works while the app is running).
//   node scripts/backup.mjs [outDir] [keepDays]
// In Docker:  docker exec rise node scripts/backup.mjs /backups 30
import { DatabaseSync, backup } from 'node:sqlite';
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const src = resolve(process.env.RISE_DB ?? 'data/rise.db');
const outDir = resolve(process.argv[2] ?? 'backups');
const keepDays = Number(process.argv[3] ?? 30);

mkdirSync(outDir, { recursive: true });
const n = new Date();
const p2 = (x) => String(x).padStart(2, '0');
const stamp = `${n.getFullYear()}-${p2(n.getMonth() + 1)}-${p2(n.getDate())}-${p2(n.getHours())}${p2(n.getMinutes())}`;
const dest = join(outDir, `rise-${stamp}.db`);

const db = new DatabaseSync(src, { readOnly: true });
await backup(db, dest);
db.close();
console.log(`backup written: ${dest}`);

// remove old backups
const cutoff = Date.now() - keepDays * 86_400_000;
for (const f of readdirSync(outDir)) {
	if (!/^rise-.*\.db$/.test(f)) continue;
	const p = join(outDir, f);
	if (statSync(p).mtimeMs < cutoff) {
		rmSync(p);
		console.log(`removed old: ${f}`);
	}
}
