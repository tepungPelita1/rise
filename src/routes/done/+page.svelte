<script lang="ts">
	import { enhance } from '$app/forms';
	import Heatmap from '#lib/components/Heatmap.svelte';
	import { niceDate, todayISO } from '#lib/dates.ts';
	import { AREA_LABEL, type Item } from '#lib/types.ts';
	import { Check, Undo2 } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const today = todayISO();

	// group by day for the timeline
	let days = $derived.by(() => {
		const m = new Map<string, Item[]>();
		for (const t of data.list) {
			const d = (t.done_at ?? '').slice(0, 10);
			if (!m.has(d)) m.set(d, []);
			m.get(d)!.push(t);
		}
		return [...m.entries()];
	});
</script>

<header class="page-head">
	<div>
		<h1>Done, <em>look how far.</em></h1>
		<p>Everything you finished. Nothing is deleted.</p>
	</div>
	<div class="big pastel-build">
		<strong>{data.thisWeek}</strong>
		<span>done this week</span>
	</div>
</header>

<Heatmap activity={data.activity} />

<h2 class="section-title">History</h2>
{#if days.length}
	<ol class="timeline">
		{#each days as [day, items] (day)}
			<li>
				<span class="node"><Check size={14} strokeWidth={3} aria-hidden="true" /></span>
				<p class="when">{niceDate(day, today)} · {items.length} done</p>
				<ul>
					{#each items as t (t.id)}
						<li class="item">
							<a href="/item/{t.id}">{t.title}</a>
							{#if t.area}<span class="chip fill {t.area}">{AREA_LABEL[t.area]}</span>{/if}
							<form method="POST" action="?/reopen" use:enhance>
								<input type="hidden" name="id" value={t.id} />
								<button class="btn ghost small" title="Not done yet"><Undo2 size={14} aria-hidden="true" /> Undo</button>
							</form>
						</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ol>
{:else}
	<p class="empty">Nothing done yet. Tick your first task on Today.</p>
{/if}

<style>
	.big {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 16px 22px;
		border-radius: 24px;
	}
	.big strong {
		font-size: 52px;
		line-height: 1;
		letter-spacing: -0.04em;
	}
	.big span {
		font-size: 13px;
		font-weight: 600;
	}
	.timeline {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.timeline > li {
		position: relative;
		padding: 0 0 24px 48px;
	}
	.timeline > li::before {
		content: '';
		position: absolute;
		left: 15px;
		top: 34px;
		bottom: 0;
		width: 2px;
		background: var(--ink);
	}
	.timeline > li:last-child::before {
		display: none;
	}
	.node {
		position: absolute;
		left: 0;
		top: 0;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--ink);
		color: var(--on-ink);
	}
	.when {
		margin: 4px 0 10px;
		font-size: 14px;
		color: var(--text-muted);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 10px 10px 18px;
		border-radius: 18px;
		background: var(--surface);
		border: 1px solid var(--border);
	}
	.item a {
		flex: 1;
		font-weight: 600;
		text-decoration: none;
		text-decoration-line: line-through;
		text-decoration-color: var(--text-muted);
	}
</style>
