<script lang="ts">
	import { enhance } from '$app/forms';
	import { celebrate } from '#lib/celebrate.ts';
	import { Check, Repeat, Target, CalendarDays, Plus, X, Undo2 } from '@lucide/svelte';
	import { AREA_LABEL, type Item } from '#lib/types.ts';
	import { daysBetween, dueHint, niceDate, todayISO } from '#lib/dates.ts';
	import type { Snippet } from 'svelte';

	interface Props {
		item: Item;
		/** today: in Today · suggest/list: can be added · done: history · overdue: decide */
		mode?: 'today' | 'suggest' | 'list' | 'done' | 'overdue';
		todayFull?: boolean;
		extra?: Snippet;
	}

	let { item, mode = 'list', todayFull = false, extra }: Props = $props();

	const today = todayISO();
	let late = $derived(item.due ? daysBetween(today, item.due) < 0 : false);
	let soon = $derived(item.due ? daysBetween(today, item.due) <= 2 : false);
	let isDone = $derived(item.status === 'done');
</script>

<li class="row" class:late class:isDone>
	{#if mode === 'done'}
		<span class="check on" aria-hidden="true"><Check size={16} strokeWidth={3} /></span>
	{:else if mode === 'suggest'}
		<!-- in Suggested, the circle adds the task to Today -->
		<form method="POST" action="?/pick" use:enhance>
			<input type="hidden" name="id" value={item.id} />
			<button
				class="check add"
				disabled={todayFull}
				aria-label="Add “{item.title}” to Today"
				title={todayFull ? 'Today is full' : 'Add to Today'}
			>
				<Plus size={18} strokeWidth={3} aria-hidden="true" />
			</button>
		</form>
	{:else}
		<form method="POST" action="?/done" use:enhance={celebrate}>
			<input type="hidden" name="id" value={item.id} />
			<button class="check" aria-label="Mark “{item.title}” as done" title="Done">
				<Check size={16} strokeWidth={3} aria-hidden="true" />
			</button>
		</form>
	{/if}

	<div class="body">
		<a class="title" href="/item/{item.id}">{item.title}</a>
		<div class="meta">
			{#if item.area}
				<span class="chip fill {item.area}">{AREA_LABEL[item.area]}</span>
			{/if}
			{#if item.due && mode !== 'done'}
				<span class="tag" class:red={late} class:warn={!late && soon}>
					<CalendarDays size={13} aria-hidden="true" />
					{niceDate(item.due, today)} · {dueHint(item.due, today)}
				</span>
			{/if}
			{#if item.do_date && mode !== 'done'}
				<span class="tag">Plan {niceDate(item.do_date, today)}</span>
			{/if}
			{#if item.repeat !== 'none'}
				<span class="tag"><Repeat size={13} aria-hidden="true" />{item.repeat}</span>
			{/if}
			{#if item.goal_title}
				<span class="tag"><Target size={13} aria-hidden="true" />{item.goal_title}</span>
			{/if}
			{#if mode === 'done' && item.done_at}
				<span class="tag">Done {niceDate(item.done_at.slice(0, 10), today)}</span>
			{/if}
		</div>
		{@render extra?.()}
	</div>

	<div class="actions">
		{#if mode === 'today'}
			<form method="POST" action="?/unpick" use:enhance>
				<input type="hidden" name="id" value={item.id} />
				<button class="btn ghost small"><X size={14} aria-hidden="true" /> Not today</button>
			</form>
		{:else if mode === 'list' && !isDone}
			<form method="POST" action="?/pick" use:enhance>
				<input type="hidden" name="id" value={item.id} />
				<button class="btn small" disabled={todayFull} title={todayFull ? 'Today is full' : 'Add to Today'}>
					<Plus size={14} aria-hidden="true" /> Today
				</button>
			</form>
		{:else if mode === 'done'}
			<form method="POST" action="?/reopen" use:enhance>
				<input type="hidden" name="id" value={item.id} />
				<button class="btn ghost small"><Undo2 size={14} aria-hidden="true" /> Undo</button>
			</form>
		{/if}
	</div>
</li>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 16px 14px 14px;
		border-radius: 20px;
		background: var(--surface);
		border: 1px solid var(--border);
		transition:
			transform 200ms ease,
			box-shadow 200ms ease,
			border-color 200ms ease;
	}
	.row:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lift);
	}
	.row.late {
		background: var(--danger-soft);
		border-color: color-mix(in srgb, var(--danger) 45%, transparent);
		align-items: flex-start;
	}
	.check {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		padding: 0;
		border-radius: 50%;
		border: 1.5px solid var(--border);
		background: var(--surface-2);
		color: color-mix(in srgb, var(--text-muted) 45%, transparent);
		cursor: pointer;
		transition:
			background 180ms ease,
			color 180ms ease,
			border-color 180ms ease;
	}
	.check:hover {
		border-color: var(--build);
		background: var(--build);
		color: var(--on-pastel);
	}
	/* the "+ add to Today" circle */
	.check.add {
		width: 38px;
		height: 38px;
		border: 2px dashed var(--ink);
		background: var(--surface);
		color: var(--ink);
		transition: all 220ms ease;
	}
	.check.add:hover:not(:disabled) {
		border-style: solid;
		border-color: var(--ink);
		background: var(--lime);
		color: #121212;
		transform: rotate(90deg);
	}
	.check.add:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.check.on {
		background: var(--build);
		border-color: var(--build);
		color: var(--on-pastel);
	}
	.body {
		flex: 1;
		min-width: 0;
	}
	.title {
		font-weight: 600;
		font-size: 15.5px;
		letter-spacing: -0.01em;
		text-decoration: none;
		overflow-wrap: anywhere;
	}
	.title:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.isDone .title {
		color: var(--text-muted);
		text-decoration: line-through;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 12px;
		margin-top: 6px;
		font-size: 13px;
		color: var(--text-muted);
	}
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.tag.red {
		color: var(--danger);
		font-weight: 600;
	}
	.tag.warn {
		color: var(--warn);
		font-weight: 600;
	}
	.actions {
		display: flex;
		gap: 6px;
	}
</style>
