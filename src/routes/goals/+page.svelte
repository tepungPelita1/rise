<script lang="ts">
	import { enhance } from '$app/forms';
	import { celebrate } from '#lib/celebrate.ts';
	import Deco from '#lib/components/Deco.svelte';
	import { AREAS, AREA_LABEL, type Area } from '#lib/types.ts';
	import { Plus, TriangleAlert, ArrowUpRight, Check, Clock } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let adding = $state(false);

	const DECO: Record<Area, 'loop' | 'flower' | 'asterisk' | 'star'> = {
		study: 'loop',
		build: 'flower',
		life: 'asterisk',
		self: 'star'
	};
</script>

<header class="page-head">
	<div>
		<h1>Goals, <em>small steps.</em></h1>
		<p>Big things broken into tiny steps. You only work on the next one.</p>
	</div>
	<button class="btn primary" onclick={() => (adding = !adding)}><Plus size={16} aria-hidden="true" /> New goal</button>
</header>

{#if adding}
	<form
		class="card newgoal"
		method="POST"
		action="?/addGoal"
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'success') adding = false;
				await update();
			}}
	>
		<label class="field">Goal name <input name="title" required placeholder="e.g. Learn Docker" /></label>
		<label class="field">
			Area
			<select name="area" required>
				{#each AREAS as a (a)}<option value={a}>{AREA_LABEL[a]}</option>{/each}
			</select>
		</label>
		<label class="field wide">
			First small step
			<input name="first_step" required placeholder="Something you can do in under 1 hour" />
		</label>
		<div class="wide bar">
			<button type="button" class="btn ghost" onclick={() => (adding = false)}>Cancel</button>
			<button class="btn primary">Add goal</button>
		</div>
	</form>
{/if}

<div class="grid">
	{#each data.goals as g (g.id)}
		{@const total = g.open_count + g.done_count}
		{@const area = (g.area ?? 'life') as Area}
		{@const done = g.steps.filter((s) => s.status === 'done')}
		{@const later = g.steps.filter((s) => s.status === 'open' && s.id !== g.next?.id)}
		<article class="goal card" class:missing={!g.next}>
			<div class="top pastel-{area}">
				<div class="deco"><Deco kind={DECO[area]} /></div>
				<div class="row">
					<span class="chip">{AREA_LABEL[area]} · {g.done_count}/{total} steps</span>
					<a class="round" href="/item/{g.id}" aria-label="Edit goal {g.title}"><ArrowUpRight size={18} /></a>
				</div>
				<h2>{g.title}</h2>
				{#if g.notes}<p class="notes"><em>{g.notes}</em></p>{/if}
				<div class="progress" aria-label="{g.done_count} of {total} steps done">
					<span style="width: {total ? (g.done_count / total) * 100 : 0}%"></span>
				</div>
			</div>

			<!-- timeline -->
			<ol class="timeline">
				{#each done as s (s.id)}
					<li class="done">
						<span class="node"><Check size={13} strokeWidth={3} aria-hidden="true" /></span>
						<p class="label">Done</p>
						<p class="t">{s.title}</p>
					</li>
				{/each}

				{#if g.next}
					<li class="now">
						<span class="node"><Clock size={14} aria-hidden="true" /></span>
						<p class="label">Next step</p>
						<a class="t" href="/item/{g.next.id}">{g.next.title}</a>
						<div class="acts">
							<form method="POST" action="?/done" use:enhance={celebrate}>
								<input type="hidden" name="id" value={g.next.id} />
								<button class="btn small primary"><Check size={14} aria-hidden="true" /> Done</button>
							</form>
							<form method="POST" action="?/pick" use:enhance>
								<input type="hidden" name="id" value={g.next.id} />
								<button class="btn small" disabled={data.todayFull}><Plus size={14} aria-hidden="true" /> Today</button>
							</form>
						</div>
					</li>
				{:else}
					<li class="now warn">
						<span class="node"><TriangleAlert size={13} aria-hidden="true" /></span>
						<p class="label">No next step</p>
						<form class="step" method="POST" action="?/addStep" use:enhance>
							<input type="hidden" name="goal_id" value={g.id} />
							<label class="sr-only" for="step-{g.id}">Next step</label>
							<input id="step-{g.id}" class="input" name="title" placeholder="Next small step" required />
							<button class="btn small primary">Add</button>
						</form>
						<form method="POST" action="?/done" use:enhance={celebrate}>
							<input type="hidden" name="id" value={g.id} />
							<button class="btn ghost small">Or mark the goal done</button>
						</form>
					</li>
				{/if}

				{#if later.length}
					<li class="later">
						<span class="node"><Clock size={13} aria-hidden="true" /></span>
						<details>
							<summary>{later.length} more step{later.length === 1 ? '' : 's'} later</summary>
							<ul>
								{#each later as s (s.id)}<li>{s.title}</li>{/each}
							</ul>
						</details>
					</li>
				{/if}
			</ol>
		</article>
	{/each}
</div>

{#if data.goals.length === 0}
	<p class="empty">No goals yet.</p>
{/if}

<style>
	.newgoal {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px 16px;
		padding: 24px;
		margin-bottom: 20px;
	}
	.wide {
		grid-column: 1 / -1;
	}
	.bar {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 20px;
		align-items: start;
	}
	.goal {
		overflow: hidden;
		padding: 8px;
		border-radius: 30px;
		transition: transform 220ms ease, box-shadow 220ms ease;
	}
	.goal:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-lift);
	}
	.top {
		position: relative;
		padding: 20px 22px 22px;
		border-radius: 24px;
		overflow: hidden;
		isolation: isolate;
	}
	.deco {
		position: absolute;
		right: -20px;
		top: -24px;
		width: 120px;
		height: 120px;
		color: rgb(255 255 255 / 0.55);
		z-index: -1;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	h2 {
		margin-top: 18px;
		font-size: 26px;
		font-weight: 600;
	}
	.notes {
		margin: 6px 0 0;
		font-size: 18px;
		line-height: 1.25;
	}
	.progress {
		height: 8px;
		margin-top: 18px;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.55);
		overflow: hidden;
	}
	.progress span {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: #121212;
		transition: width 400ms ease;
	}

	/* timeline (reference #4) */
	.timeline {
		list-style: none;
		margin: 0;
		padding: 20px 18px 12px 18px;
	}
	.timeline > li {
		position: relative;
		padding: 0 0 18px 44px;
	}
	.timeline > li::before {
		content: '';
		position: absolute;
		left: 14px;
		top: 32px;
		bottom: 2px;
		width: 2px;
		background: var(--border);
	}
	.timeline > li.done::before {
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
		width: 30px;
		height: 30px;
		border-radius: 50%;
		border: 2px solid var(--border);
		background: var(--surface);
		color: var(--text-muted);
	}
	.done .node {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--on-ink);
	}
	.now .node {
		border-color: var(--ink);
		color: var(--ink);
		box-shadow: 0 0 0 4px var(--lime);
	}
	.warn .node {
		border-color: var(--warn);
		color: var(--warn);
		box-shadow: none;
	}
	.label {
		margin: 0;
		font-size: 12px;
		color: var(--text-muted);
	}
	.t {
		display: block;
		margin: 2px 0 0;
		font-weight: 600;
		font-size: 16px;
		letter-spacing: -0.01em;
		text-decoration: none;
	}
	a.t:hover {
		text-decoration: underline;
	}
	.done .t {
		color: var(--text-muted);
		font-weight: 500;
	}
	.acts {
		display: flex;
		gap: 6px;
		margin-top: 10px;
	}
	.step {
		display: flex;
		gap: 8px;
		margin: 8px 0;
	}
	.step .input {
		flex: 1;
	}
	.later {
		color: var(--text-muted);
	}
	summary {
		cursor: pointer;
		font-size: 14px;
		line-height: 30px;
	}
	details ul {
		margin: 4px 0 0;
		padding-left: 18px;
		font-size: 14px;
	}

	@media (max-width: 860px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
