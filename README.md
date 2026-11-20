# Rise

Personal task dashboard. Pick max 3 things a day. See [docs/SPEC.md](docs/SPEC.md).

## Run (laptop)

```
npm install
npm run dev
```

Open http://localhost:5173. Press `Ctrl K` anywhere to add a task.

## Hosting

Rise is self-hosted on my homelab (Docker). The deployment setup is kept private.

## Data

- SQLite file: `data/rise.db` (change with env `RISE_DB`).
- First run fills it with the 20 Nov 2026 brain dump (`src/lib/server/seed.ts`).
- Backup: `node scripts/backup.mjs <folder>` (safe while the app runs).
