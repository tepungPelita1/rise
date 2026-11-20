<script lang="ts">
	import TaskRow from '#lib/components/TaskRow.svelte';
	import { AREA_LABEL } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let total = $derived(data.groups.reduce((n, g) => n + g.items.length, 0) + data.noArea.length);
</script>

<header class="page-head">
	<div>
		<h1>Later, <em>no rush.</em></h1>
		<p>{total} tasks waiting. Only the next step of each goal is shown.</p>
	</div>
</header>

{#each data.groups as g (g.area)}
	{#if g.items.length}
		<h2 class="section-title"><span class="chip fill {g.area} big">{AREA_LABEL[g.area]}</span><span class="count">{g.items.length} tasks</span></h2>
		<ul class="list">
			{#each g.items as item (item.id)}
				<TaskRow {item} mode="list" todayFull={data.todayFull} />
			{/each}
		</ul>
	{/if}
{/each}

{#if data.noArea.length}
	<h2 class="section-title"><span class="dot"></span>No area</h2>
	<ul class="list">
		{#each data.noArea as item (item.id)}
			<TaskRow {item} mode="list" todayFull={data.todayFull} />
		{/each}
	</ul>
{/if}

{#if total === 0}
	<p class="empty">Nothing waiting. Enjoy the free time.</p>
{/if}

{#if data.droppedCount > 0}
	<p class="bin-link"><a href="/bin">Bin · {data.droppedCount} dropped</a> — bring things back anytime.</p>
{/if}

<style>
	.bin-link {
		margin-top: 32px;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-muted);
	}
	.bin-link a {
		color: var(--text);
	}
</style>
