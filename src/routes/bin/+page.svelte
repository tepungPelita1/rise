<script lang="ts">
	import { enhance } from '$app/forms';
	import { notify } from '#lib/toast.svelte.ts';
	import { AREA_LABEL } from '#lib/types.ts';
	import { RotateCcw, Trash2, Target, Repeat } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<header class="page-head">
	<div>
		<h1>Bin, <em>nothing is lost.</em></h1>
		<p>Everything you dropped. Bring it back anytime.</p>
	</div>
</header>

{#if data.items.length === 0}
	<div class="empty">
		<Trash2 size={28} aria-hidden="true" />
		<p>Bin is empty.</p>
	</div>
{:else}
	<ul class="list">
		{#each data.items as item (item.id)}
			<li class="row">
				<div class="body">
					<a class="title" href="/item/{item.id}">{item.title}</a>
					<div class="meta">
						{#if item.area}<span class="chip fill {item.area}">{AREA_LABEL[item.area]}</span>{/if}
						{#if item.type === 'goal'}<span class="chip">goal</span>{/if}
						{#if item.type === 'habit'}<span class="chip"><Repeat size={11} aria-hidden="true" /> habit</span>{/if}
						{#if item.goal_title}<span class="tag"><Target size={13} aria-hidden="true" />{item.goal_title}</span>{/if}
					</div>
				</div>
				<form
					method="POST"
					action="?/restore"
					use:enhance={() =>
						async ({ result, update }) => {
							await update();
							if (result.type === 'success') notify(`Brought back “${item.title}”`);
						}}
				>
					<input type="hidden" name="id" value={item.id} />
					<button class="btn small primary"><RotateCcw size={14} aria-hidden="true" /> Bring back</button>
				</form>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.empty :global(svg) {
		color: var(--text-muted);
	}
	.empty p {
		margin: 8px 0 0;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 16px;
		border-radius: 20px;
		background: var(--surface);
		border: 1.5px dashed var(--border);
	}
	.body {
		flex: 1;
		min-width: 0;
	}
	.title {
		font-weight: 600;
		color: var(--text-muted);
		text-decoration: line-through;
		text-decoration-color: var(--border);
		overflow-wrap: anywhere;
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
</style>
