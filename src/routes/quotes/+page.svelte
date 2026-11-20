<script lang="ts">
	import { enhance } from '$app/forms';
	import Ransom from '#lib/components/Ransom.svelte';
	import { ArrowLeft, Trash2, Plus } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let draft = $state('');
	let editing = $state<number | null>(null);
	const COLORS = ['lime', 'self', 'study', 'life', 'build', 'sky'];
</script>

<a class="back" href="/"><ArrowLeft size={16} aria-hidden="true" /> Today</a>

<header class="page-head">
	<div>
		<h1>Quotes, <em>hype yourself.</em></h1>
		<p>One of these shows on Today at random. Add as many as you want.</p>
	</div>
</header>

<form
	class="add pastel-lime"
	method="POST"
	action="?/add"
	use:enhance={() =>
		async ({ update }) => {
			draft = '';
			await update();
		}}
>
	<label class="sr-only" for="newq">New quote</label>
	<input id="newq" class="input" name="text" bind:value={draft} maxlength="200" placeholder="Type a line that fires you up…" required />
	<button class="btn primary"><Plus size={16} aria-hidden="true" /> Add</button>
	{#if draft.trim()}
		<div class="preview"><span class="label">Preview</span><Ransom text={draft} size={26} /></div>
	{/if}
</form>

<div class="grid">
	{#each data.quotes as q, i (q.id)}
		<article class="q pastel-{COLORS[i % COLORS.length]}">
			{#if editing === q.id}
				<form
					method="POST"
					action="?/save"
					use:enhance={() =>
						async ({ result, update }) => {
							if (result.type === 'success') editing = null;
							await update({ reset: false });
						}}
				>
					<input type="hidden" name="id" value={q.id} />
					<textarea class="input" name="text" maxlength="200" required>{q.text}</textarea>
					<div class="bar">
						<button type="button" class="btn small" onclick={() => (editing = null)}>Cancel</button>
						<button class="btn small primary">Save</button>
					</div>
				</form>
			{:else}
				<button class="body" onclick={() => (editing = q.id)} title="Click to edit">
					<Ransom text={q.text} size={26} />
				</button>
				<form method="POST" action="?/remove" use:enhance class="del">
					<input type="hidden" name="id" value={q.id} />
					<button class="qbtn" aria-label="Delete quote" title="Delete"><Trash2 size={14} aria-hidden="true" /></button>
				</form>
			{/if}
		</article>
	{/each}
</div>

{#if data.quotes.length === 0}
	<p class="empty">No quotes yet. Add your first one above.</p>
{/if}

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		color: var(--text-muted);
		text-decoration: none;
	}
	.add {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		padding: 18px;
		border-radius: 28px;
	}
	.add .input {
		flex: 1;
		min-width: 220px;
		background: #fff;
		color: #121212;
		border-color: transparent;
	}
	.add .btn.primary {
		background: #121212;
		border-color: #121212;
		color: #fff;
	}
	.preview {
		width: 100%;
		padding: 8px 6px 4px;
	}
	.label {
		display: block;
		margin-bottom: 6px;
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 16px;
		margin-top: 24px;
	}
	.q {
		position: relative;
		min-height: 180px;
		padding: 22px;
		border-radius: 28px;
		transition: transform 220ms ease;
	}
	.q:nth-child(odd) {
		transform: rotate(-0.8deg);
	}
	.q:nth-child(even) {
		transform: rotate(0.8deg);
	}
	.q:hover {
		transform: rotate(0) translateY(-3px);
	}
	.body {
		all: unset;
		display: block;
		cursor: text;
		padding-right: 30px;
	}
	.del {
		position: absolute;
		top: 14px;
		right: 14px;
	}
	.qbtn {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 1.5px solid #121212;
		background: transparent;
		color: #121212;
		cursor: pointer;
	}
	.qbtn:hover {
		background: #121212;
		color: #fff;
	}
	textarea {
		width: 100%;
		min-height: 90px;
		background: #fff;
		color: #121212;
		border-color: transparent;
	}
	.bar {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 10px;
	}
	.bar .btn {
		background: #fff;
		color: #121212;
		border-color: #121212;
	}
	.bar .btn.primary {
		background: #121212;
		color: #fff;
	}
</style>
