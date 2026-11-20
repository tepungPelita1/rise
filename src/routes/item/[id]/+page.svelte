<script lang="ts">
	import { enhance } from '$app/forms';
	import ItemFields from '#lib/components/ItemFields.svelte';
	import { celebrate } from '#lib/celebrate.ts';
	import { notify } from '#lib/toast.svelte.ts';
	import { ArrowLeft, ArrowUp, ArrowDown, Check } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let kind = $derived(data.item.type === 'goal' ? 'goal' : data.item.type === 'habit' ? 'habit' : 'task');
	let doneSteps = $derived(data.steps.filter((s) => s.status === 'done'));
	let openSteps = $derived(data.steps.filter((s) => s.status === 'open'));
</script>

<a class="back" href="/later" onclick={(e) => { if (history.length > 1) { e.preventDefault(); history.back(); } }}><ArrowLeft size={16} aria-hidden="true" /> Back</a>

<header class="page-head">
	<div>
		<h1>Edit <em>{kind}.</em></h1>
		{#if data.item.status === 'done'}<p>This is done.</p>{/if}
		{#if data.item.status === 'dropped'}<p>This was dropped. It's in the <a href="/bin">Bin</a>.</p>{/if}
	</div>
</header>

{#key data.item.id}
	<form
		class="card box"
		method="POST"
		action="?/save"
		use:enhance={({ action }) => {
			// capture now: after the redirect this page is gone
			const { id, title } = data.item;
			const dropping = action.search.includes('/remove');
			return async ({ result, update }) => {
				if (dropping && result.type === 'redirect') notify(`Dropped “${title}”`, id);
				await update({ reset: false });
			};
		}}
	>
		<input type="hidden" name="id" value={data.item.id} />
		<ItemFields item={data.item} goals={data.goals} />
		<div class="bar">
			{#if data.item.status !== 'dropped'}
				<button class="btn ghost danger" formaction="?/remove" formnovalidate>Drop</button>
			{/if}
			<span class="spacer"></span>
			{#if data.item.status === 'done' || data.item.status === 'dropped'}
				<button class="btn" formaction="?/restore" formnovalidate>Bring back</button>
			{/if}
			<button class="btn primary">Save</button>
		</div>
	</form>
{/key}

{#if data.item.type === 'goal'}
	<h2 class="section-title">Steps <em>— in order</em></h2>

	<ol class="steps">
		{#each doneSteps as s (s.id)}
			<li class="step done">
				<span class="num"><Check size={14} strokeWidth={3} aria-hidden="true" /></span>
				<a class="t" href="/item/{s.id}">{s.title}</a>
			</li>
		{/each}

		{#each openSteps as s, i (s.id)}
			<li class="step" class:next={i === 0}>
				<span class="num">{doneSteps.length + i + 1}</span>
				<div class="tbox">
					{#if i === 0}<span class="label">Next step</span>{/if}
					<a class="t" href="/item/{s.id}">{s.title}</a>
				</div>
				<div class="acts">
					<form method="POST" action="?/move" use:enhance={() => async ({ update }) => update({ invalidateAll: true })}>
						<input type="hidden" name="id" value={s.id} />
						<input type="hidden" name="dir" value="up" />
						<button class="arrow" disabled={i === 0} aria-label="Move “{s.title}” up" title="Move up">
							<ArrowUp size={16} aria-hidden="true" />
						</button>
					</form>
					<form method="POST" action="?/move" use:enhance={() => async ({ update }) => update({ invalidateAll: true })}>
						<input type="hidden" name="id" value={s.id} />
						<input type="hidden" name="dir" value="down" />
						<button class="arrow" disabled={i === openSteps.length - 1} aria-label="Move “{s.title}” down" title="Move down">
							<ArrowDown size={16} aria-hidden="true" />
						</button>
					</form>
					<form method="POST" action="?/done" use:enhance={celebrate}>
						<input type="hidden" name="id" value={s.id} />
						<button class="arrow ok" aria-label="Mark “{s.title}” as done" title="Done">
							<Check size={16} strokeWidth={3} aria-hidden="true" />
						</button>
					</form>
				</div>
			</li>
		{/each}
	</ol>

	{#if data.steps.length === 0}
		<p class="empty">No steps yet. Add the first small step below.</p>
	{/if}

	<form class="add" method="POST" action="?/addStep" use:enhance>
		<label class="sr-only" for="newstep">New step</label>
		<input id="newstep" class="input" name="title" placeholder="Add a step (goes to the end, move it with ↑)" required />
		<button class="btn primary">Add step</button>
	</form>
{/if}

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 16px;
		font-size: 14px;
		color: var(--text-muted);
		text-decoration: none;
	}
	.back:hover {
		color: var(--text);
	}
	.page-head a {
		color: var(--text);
	}
	.box {
		padding: 20px;
	}
	.bar {
		display: flex;
		gap: 8px;
		margin-top: 20px;
	}
	.spacer {
		flex: 1;
	}

	.steps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.step {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 10px 10px 12px;
		border-radius: 18px;
		background: var(--surface);
		border: 1px solid var(--border);
	}
	.step.next {
		border: 2.5px solid var(--ink);
		box-shadow: 4px 4px 0 var(--ink);
	}
	.num {
		display: grid;
		place-items: center;
		flex: none;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--surface-2);
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 700;
	}
	.next .num {
		background: var(--lime);
		color: #121212;
	}
	.done .num {
		background: var(--ink);
		color: var(--on-ink);
	}
	.tbox {
		flex: 1;
		min-width: 0;
	}
	.label {
		display: block;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-muted);
	}
	.t {
		font-weight: 600;
		text-decoration: none;
		overflow-wrap: anywhere;
	}
	.done .t {
		flex: 1;
		color: var(--text-muted);
		font-weight: 500;
		text-decoration: line-through;
	}
	.acts {
		display: flex;
		gap: 4px;
	}
	.arrow {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		border: 1.5px solid var(--border);
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
		transition: border-color 150ms ease, background 150ms ease;
	}
	.arrow:hover:not(:disabled) {
		border-color: var(--ink);
	}
	.arrow:disabled {
		opacity: 0.3;
		cursor: default;
	}
	.arrow.ok:hover {
		background: var(--build);
		border-color: var(--build);
		color: #121212;
	}
	.empty {
		margin-top: 8px;
	}
	.add {
		display: flex;
		gap: 8px;
		margin-top: 12px;
	}
	.add .input {
		flex: 1;
	}
</style>
