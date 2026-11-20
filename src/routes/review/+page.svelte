<script lang="ts">
	import { enhance } from '$app/forms';
	import { niceDate } from '#lib/dates.ts';
	import { Check } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let inboxOk = $derived(data.inboxCount === 0);
	let goalsOk = $derived(data.missing.length === 0);
</script>

<header class="page-head">
	<div>
		<h1>Week Review, <em>five minutes.</em></h1>
		<p>
			5 minutes, every Sunday night. You finished <strong>{data.doneWeek}</strong> things this week.
			{#if data.lastReview}Last review: {niceDate(data.lastReview)}.{/if}
		</p>
	</div>
</header>

<ol class="steps">
	<li class="card" class:ok={inboxOk}>
		<span class="num">{#if inboxOk}<Check size={16} aria-hidden="true" />{:else}1{/if}</span>
		<div>
			<h2>Empty the Inbox</h2>
			{#if inboxOk}
				<p>Inbox is empty.</p>
			{:else}
				<p>You have {data.inboxCount} item{data.inboxCount === 1 ? '' : 's'} to sort.</p>
				<a class="btn small primary" href="/inbox">Go to Inbox</a>
			{/if}
		</div>
	</li>

	<li class="card" class:ok={goalsOk}>
		<span class="num">{#if goalsOk}<Check size={16} aria-hidden="true" />{:else}2{/if}</span>
		<div class="grow">
			<h2>Every goal has a next step</h2>
			{#if goalsOk}
				<p>All goals have a next step.</p>
			{:else}
				<p>These goals have no next step:</p>
				{#each data.missing as g (g.id)}
					<form class="step" method="POST" action="?/addStep" use:enhance>
						<input type="hidden" name="goal_id" value={g.id} />
						<label for="s-{g.id}">{g.title}</label>
						<div class="inline">
							<input id="s-{g.id}" class="input" name="title" placeholder="Next small step" required />
							<button class="btn small primary">Add</button>
						</div>
					</form>
				{/each}
				<p class="hint">Or open the goal in <a href="/goals">Goals</a> and mark it done.</p>
			{/if}
		</div>
	</li>

	<li class="card">
		<span class="num">3</span>
		<form class="grow" method="POST" action="?/finish" use:enhance={() => async ({ update }) => update({ reset: false })}>
			<h2>Pick one focus for next week</h2>
			<p>One sentence. It will show on Today all week.</p>
			<label class="sr-only" for="focus">Focus for next week</label>
			<input id="focus" class="input wide" name="focus" value={data.focus} maxlength="140" placeholder="e.g. Finish CSP and start FYP proposal" />
			<button class="btn primary">Finish review</button>
		</form>
	</li>
</ol>

<style>
	.steps {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.steps > li {
		display: flex;
		gap: 16px;
		padding: 20px;
	}
	.num {
		display: grid;
		place-items: center;
		flex: none;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--surface-2);
		font-weight: 600;
		font-size: 14px;
	}
	.ok .num {
		background: var(--ink);
		color: var(--on-ink);
	}
	.grow {
		flex: 1;
		min-width: 0;
	}
	h2 {
		font-size: 17px;
		font-weight: 600;
	}
	p {
		margin: 4px 0 12px;
		color: var(--text-muted);
		font-size: 14px;
	}
	.step {
		margin-bottom: 12px;
	}
	.step label {
		display: block;
		font-size: 14px;
		font-weight: 500;
		margin-bottom: 6px;
	}
	.inline {
		display: flex;
		gap: 8px;
	}
	.inline .input {
		flex: 1;
	}
	.wide {
		width: 100%;
		margin-bottom: 12px;
	}
	.hint a {
		color: var(--ink);
	}
</style>
