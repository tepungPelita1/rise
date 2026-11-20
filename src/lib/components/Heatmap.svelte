<script lang="ts">
	import { addDays, fromISO, niceDate, todayISO, weekStart } from '#lib/dates.ts';

	interface Props {
		activity: Record<string, number>;
		weeks?: number;
		title?: string;
	}

	let { activity = {}, weeks = 53, title }: Props = $props();

	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const today = todayISO();

	let columns = $derived.by(() => {
		const first = addDays(weekStart(today), -(weeks - 1) * 7);
		let lastMonth = -1;
		const cols = Array.from({ length: weeks }, (_, w) => {
			const start = addDays(first, w * 7);
			const m = fromISO(start).getMonth();
			const label = m !== lastMonth ? MONTHS[m] : '';
			lastMonth = m;
			const days = Array.from({ length: 7 }, (_, d) => {
				const date = addDays(start, d);
				return { date, n: activity[date] ?? 0, future: date > today };
			});
			return { label, days };
		});
		// avoid two month labels squeezed together at the start
		if (cols[1]?.label || cols[2]?.label) cols[0].label = '';
		return cols;
	});

	let total = $derived(Object.values(activity).reduce((a, b) => a + b, 0));

	const level = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 3 : 4);
</script>

<section class="card heat" aria-label="Activity heatmap">
	<header>
		<h2><strong>{total}</strong> {total === 1 ? 'thing' : 'things'} done <em>{title ?? 'in the last year'}</em></h2>
	</header>

	<div class="scroll">
		<div class="grid" style="--weeks: {weeks}">
			<span></span>
			{#each columns as col, i (i)}
				<span class="month">{col.label}</span>
			{/each}

			{#each [0, 1, 2, 3, 4, 5, 6] as d (d)}
				<span class="wd">{d === 0 ? 'Mon' : d === 2 ? 'Wed' : d === 4 ? 'Fri' : ''}</span>
				{#each columns as col, i (i)}
					{@const cell = col.days[d]}
					<span
						class="cell l{level(cell.n)}"
						class:future={cell.future}
						class:today={cell.date === today}
						title={cell.future ? '' : `${cell.n} done · ${niceDate(cell.date, today)}`}
					></span>
				{/each}
			{/each}
		</div>
	</div>

	<footer>
		<span>Tick tasks and habits to fill the boxes.</span>
		<span class="legend">
			Less
			{#each [0, 1, 2, 3, 4] as l (l)}<span class="cell l{l}"></span>{/each}
			More
		</span>
	</footer>
</section>

<style>
	.heat {
		padding: 24px 26px;
	}
	h2 {
		font-size: 20px;
		font-weight: 500;
		letter-spacing: -0.02em;
	}
	h2 strong {
		font-weight: 700;
	}
	h2 em {
		color: var(--text-muted);
		font-size: 1.1em;
	}
	.scroll {
		overflow-x: auto;
		margin-top: 18px;
		padding-bottom: 4px;
	}
	.grid {
		display: grid;
		grid-template-columns: 32px repeat(var(--weeks), 15px);
		grid-auto-rows: auto;
		gap: 4px;
		width: max-content;
		margin: 0 auto;
	}
	.month {
		font-size: 12px;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: visible;
		height: 18px;
	}
	.wd {
		font-size: 11px;
		color: var(--text-muted);
		line-height: 1;
		align-self: center;
	}
	.cell {
		aspect-ratio: 1;
		border-radius: 3px;
		background: var(--heat-0);
		width: 15px;
	}
	.cell.l1 { background: var(--heat-1); }
	.cell.l2 { background: var(--heat-2); }
	.cell.l3 { background: var(--heat-3); }
	.cell.l4 { background: var(--heat-4); }
	.cell.future {
		background: transparent;
		outline: 1px dashed var(--border);
		outline-offset: -1px;
	}
	.cell.today {
		outline: 2px solid var(--ink);
		outline-offset: 1px;
	}
	footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		margin-top: 14px;
		font-size: 12px;
		color: var(--text-muted);
	}
	.legend {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	.legend .cell {
		width: 13px;
		height: 13px;
	}
	@media (max-width: 520px) {
		footer > span:first-child {
			display: none;
		}
	}
</style>
