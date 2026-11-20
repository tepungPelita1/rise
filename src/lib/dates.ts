// All dates are local calendar dates stored as 'YYYY-MM-DD'.

export function toISO(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function fromISO(s: string): Date {
	const [y, m, d] = s.split('-').map(Number);
	return new Date(y, m - 1, d);
}

export function todayISO(): string {
	return toISO(new Date());
}

export function addDays(s: string, n: number): string {
	const d = fromISO(s);
	d.setDate(d.getDate() + n);
	return toISO(d);
}

export function addMonths(s: string, n: number): string {
	const d = fromISO(s);
	d.setMonth(d.getMonth() + n);
	return toISO(d);
}

export function daysBetween(a: string, b: string): number {
	return Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86_400_000);
}

/** Monday of the week that contains `s`. */
export function weekStart(s: string): string {
	const d = fromISO(s);
	const offset = (d.getDay() + 6) % 7;
	return addDays(s, -offset);
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Short, friendly label: "Today", "Tomorrow", "Mon 23 Nov". */
export function niceDate(s: string, today = todayISO()): string {
	const diff = daysBetween(today, s);
	if (diff === 0) return 'Today';
	if (diff === 1) return 'Tomorrow';
	if (diff === -1) return 'Yesterday';
	const d = fromISO(s);
	return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "in 3 days", "2 days late" */
export function dueHint(s: string, today = todayISO()): string {
	const diff = daysBetween(today, s);
	if (diff < 0) return `${-diff} day${diff === -1 ? '' : 's'} late`;
	if (diff === 0) return 'due today';
	if (diff === 1) return 'due tomorrow';
	return `in ${diff} days`;
}
