<script lang="ts">
	import { enhance } from '$app/forms';
	import { dropWithUndo } from '#lib/toast.svelte.ts';
	import ItemFields from '#lib/components/ItemFields.svelte';
	import { Inbox, Trash2 } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let openId = $state<number | null>(null);
</script>

<header class="page-head">
	<div>
		<h1>Inbox, <em>sort it out.</em></h1>
		<p>New things you wrote down. Give each one an area and a kind.</p>
	</div>
</header>

{#if data.items.length === 0}
	<div class="empty">
		<Inbox size={28} aria-hidden="true" />
		<p>Inbox is empty. Nice!</p>
		<p class="small">Press <kbd>Ctrl K</kbd> anytime to add something.</p>
	</div>
{:else}
	<ul class="list">
		{#each data.items as item (item.id)}
			<li class="card item">
				{#if openId === item.id}
					<form
						method="POST"
						action="?/sort"
						use:enhance={() =>
							async ({ result, update }) => {
								if (result.type === 'success') openId = null;
								await update({ reset: false });
							}}
					>
						<input type="hidden" name="id" value={item.id} />
						<ItemFields {item} goals={data.goals} askFirstStep showNotes={false} />
						<div class="bar">
							<button type="button" class="btn ghost" onclick={() => (openId = null)}>Cancel</button>
							<button class="btn primary">Save</button>
						</div>
					</form>
				{:else}
					<div class="line">
						<span class="title">{item.title}</span>
						<button class="btn small primary" onclick={() => (openId = item.id)}>Sort</button>
						<form method="POST" action="?/drop" use:enhance={dropWithUndo(item.title)}>
							<input type="hidden" name="id" value={item.id} />
							<button class="btn ghost small" aria-label="Drop “{item.title}”" title="Drop">
								<Trash2 size={15} aria-hidden="true" />
							</button>
						</form>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.empty :global(svg) {
		color: var(--ink);
	}
	.empty p {
		margin: 8px 0 0;
	}
	.small {
		font-size: 13px;
	}
	.item {
		padding: 14px 16px;
	}
	.line {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.title {
		flex: 1;
		font-weight: 500;
		overflow-wrap: anywhere;
	}
	.bar {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 16px;
	}
</style>
