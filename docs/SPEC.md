# Rise v1 — Spec (formerly TaskHQ)

Personal task dashboard for one user. Agreed through a grilling session on 2026-11-20.

## Problem
Too many tasks of different *kinds* mixed in one list (deadline tasks, weekend chores, multi-step
projects, vague learning goals, habits, shopping). The real pain: not knowing what to start first.

## Stack
- SvelteKit (Svelte 5) + TypeScript, form actions for all writes
- SQLite via Node built-in `node:sqlite` (single file `data/rise.db`)
- No login (LAN / Tailscale only — never expose publicly)
- Laptop first. Docker for homelab comes later.

## Item types
| Type  | Meaning | Done? |
|-------|---------|-------|
| task  | Can be finished. Optional parent goal. | yes |
| goal  | Container (project or learning goal). Must always have one *next action*. | yes |
| habit | Repeats daily, tracked with a tick + streak. | never |

## Areas (4)
Study · Build · Life Admin · Self — one colour each.

## Task fields
title, notes, area, type, due date (real deadline), do date (when you plan to do it),
repeat (none/daily/weekly/monthly), status (inbox/open/today/done/dropped), goal_id, position.

## Screens
- **Today** — max 3 tasks. Overdue tasks show first in red with *Do today / New date / Drop*.
  Suggestions = nearest due date, then do date ≤ today. Habit strip below (doesn't use a slot).
- **Inbox** — quick add (`Ctrl+K` anywhere). Sort later: give area + type.
- **Later** — all other open tasks, grouped by area.
- **Goals** — each goal shows only its next step (lowest position open task).
- **Done** — history + "X done this week". Nothing deleted for good.
- **Week Review** — Sunday night: empty inbox → check every goal has a next step → pick focus.

## Repeat
Ticking a repeating task done creates a new copy with dates moved forward.

## UI
Simple English. Calm, minimal (Swiss style). Dark mode default + light mode. Inter font.
Lucide icons, no emoji icons. Design tokens in `design-system/taskhq/MASTER.md`.

## Not in v1
Notifications, phone layout polish, multi-user, password.

## Next up (v1.1) — complete the CRUD

Status today (2026-11-20): data is real CRUD in SQLite, but these gaps remain.

**Missing CRUD**
- [x] View + restore dropped items (Bin page + Undo toast on every Drop)
- [ ] Hard delete (with confirm) for tasks, goals, habits
- [x] Reorder goal steps (↑ ↓ on the goal edit page)
- [ ] Search across all tasks
- [ ] Edit/delete habits more directly (today only via Drop on the edit page)

**Still hardcoded → make editable?**
- [ ] The 4 Areas (Study / Build / Life Admin / Self) and their colours
- [ ] Today limit = 3 (`TODAY_LIMIT` in `src/lib/types.ts`)
- [ ] Buddy's default lines (`src/lib/components/Buddy.svelte`)
- [ ] Marquee phrases (`src/lib/components/Marquee.svelte`)
- [ ] Sticker set (`src/lib/components/Playground.svelte`)

Already editable: tasks, goals, steps, habits, quotes, week focus.
The 28-task seed only runs once, on an empty database.
