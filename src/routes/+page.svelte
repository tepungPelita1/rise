<script lang="ts">
	import { enhance } from '$app/forms';
	import { dropWithUndo } from '#lib/toast.svelte.ts';
	import TaskRow from '#lib/components/TaskRow.svelte';
	import TodayCard from '#lib/components/TodayCard.svelte';
	import Heatmap from '#lib/components/Heatmap.svelte';
	import Deco from '#lib/components/Deco.svelte';
	import { fromISO } from '#lib/dates.ts';
	import { AREA_LABEL, TODAY_LIMIT } from '#lib/types.ts';
	import Ransom from '#lib/components/Ransom.svelte';
	import Playground from '#lib/components/Playground.svelte';
	import Marquee from '#lib/components/Marquee.svelte';
	import { burst } from '#lib/celebrate.ts';
	import { Flame, Check, TriangleAlert, ArrowUpRight, Plus, Shuffle, Pencil } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let full = $derived(data.picks.length >= TODAY_LIMIT);
	let left = $derived(TODAY_LIMIT - data.picks.length);
	const hour = new Date().getHours();
	const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
	let dateText = $derived(
		fromISO(data.today).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
	);
	let maxOpen = $derived(Math.max(1, ...data.areas.map((a) => a.open + a.week)));

	// random quote; the shuffle button asks the server for a different one
	let picked = $state<{ id: number; text: string } | null>(null);
	let quote = $derived(picked ?? data.quote);
	async function shuffle() {
		const r = await fetch(`/api/quote?not=${quote?.id ?? ''}`);
		if (r.ok) picked = await r.json();
	}
</script>

<!-- HERO -->
<section class="hero">
	<div class="headline">
		<p class="hello">{hello} · {dateText}</p>
		<h1>
			<span class="ast" aria-hidden="true">✱</span> Today,<br />
			<em>pick</em> <span class="sticker">three.</span>
		</h1>
		<p class="lead">Not twenty. Three. Finish them and everything else can wait in Later.</p>

		<!-- Pantom-style plus grid: one big + per slot -->
		<div class="slots" role="img" aria-label="{data.picks.length} of {TODAY_LIMIT} slots picked">
			{#each Array(TODAY_LIMIT) as _, i}
				<span class="plus" class:on={i < data.picks.length}>+</span>
			{/each}
			<span class="slot-text">{data.picks.length}/{TODAY_LIMIT} picked</span>
		</div>

		<Playground lines={data.quote ? [data.quote.text] : []} mood={data.doneWeek} />
	</div>

	<aside class="focus pastel-lime">
		<svg class="badge" viewBox="0 0 100 100" aria-hidden="true">
			<defs><path id="c" d="M50 50 m-37 0 a37 37 0 1 1 74 0 a37 37 0 1 1 -74 0" /></defs>
			<text><textPath href="#c" textLength="228" lengthAdjust="spacing">ONE STEP · AT A TIME · ONE STEP · AT A TIME ·</textPath></text>
			<path d="M50 34 C52 46 54 48 66 50 C54 52 52 54 50 66 C48 54 46 52 34 50 C46 48 48 46 50 34Z" />
		</svg>
		<span class="chip">This week's focus</span>
		{#if data.focus}
			<p class="focus-text"><em>{data.focus}</em></p>
		{:else}
			<p class="focus-text"><em>No focus yet.</em></p>
			<a class="btn small primary" href="/review">Set it in Review</a>
		{/if}
		{#if data.reviewDue}
			<a class="btn small primary" href="/review">It's Sunday — do your Week Review</a>
		{/if}

		<div class="quote">
			<span class="qmark" aria-hidden="true">“</span>
			{#if quote}
				{#key quote.id}
					<div class="qbody"><Ransom text={quote.text} size={30} /></div>
				{/key}
			{:else}
				<p class="noquote">No quotes yet. <a href="/quotes">Add one</a>.</p>
			{/if}
			<div class="qbar">
				{#if (data.quoteCount ?? 0) > 1}
					<button class="qbtn" onclick={shuffle} aria-label="Show another quote" title="Another one">
						<Shuffle size={15} aria-hidden="true" />
					</button>
				{/if}
				<a class="qbtn" href="/quotes" aria-label="Edit quotes" title="Edit quotes"><Pencil size={14} aria-hidden="true" /></a>
			</div>
		</div>
	</aside>
</section>

<!-- LATE -->
{#if data.overdue.length}
	<h2 class="section-title late"><TriangleAlert size={20} aria-hidden="true" /> Late <em>— decide now</em></h2>
	<ul class="list">
		{#each data.overdue as item (item.id)}
			<TaskRow {item} mode="overdue">
				{#snippet extra()}
					<div class="decide">
						<form method="POST" action="?/pick" use:enhance>
							<input type="hidden" name="id" value={item.id} />
							<button class="btn small primary" disabled={full}>Do today</button>
						</form>
						<form method="POST" action="?/newDate" use:enhance class="newdate">
							<input type="hidden" name="id" value={item.id} />
							<label class="sr-only" for="nd-{item.id}">New due date</label>
							<input id="nd-{item.id}" class="input small" type="date" name="due" min={data.today} required />
							<button class="btn small">New date</button>
						</form>
						<form method="POST" action="?/drop" use:enhance={dropWithUndo(item.title)}>
							<input type="hidden" name="id" value={item.id} />
							<button class="btn ghost small danger">Drop</button>
						</form>
					</div>
				{/snippet}
			</TaskRow>
		{/each}
	</ul>
{/if}

<Marquee words={data.quote ? [data.quote.text] : []} />

<!-- TODAY'S 3 -->
<div class="three">
	{#each data.picks as item, i (item.id)}
		<TodayCard {item} index={i} />
	{/each}
	{#each Array(left) as _, i}
		<div class="slot-empty">
			<span class="big-plus" aria-hidden="true"><Plus size={30} /></span>
			<p><strong>Slot {data.picks.length + i + 1}</strong> <em>is free.</em></p>
			<p class="small">Pick one from the list below.</p>
		</div>
	{/each}
</div>

{#if full}
	<p class="full"><Check size={16} aria-hidden="true" /> Today is set. Focus on these {TODAY_LIMIT}. Everything else can wait.</p>
{/if}

<!-- BENTO: suggestions + stats + habits -->
<div class="bento">
	<section class="col-wide">
		{#if !full && data.suggestions.length}
			<h2 class="section-title">Suggested <em>— pick {left} more</em></h2>
			<ul class="list">
				{#each data.suggestions as item (item.id)}
					<TaskRow {item} mode="suggest" />
				{/each}
			</ul>
			<a class="more" href="/later">See everything in Later <ArrowUpRight size={15} aria-hidden="true" /></a>
		{:else}
			<h2 class="section-title">Nice. <em>Stay on the three.</em></h2>
			<div class="calm card">
				<Deco kind="arc" class="arc" />
				<p>Everything else is safe in <a href="/later">Later</a>. Come back here when you finish one.</p>
			</div>
		{/if}
	</section>

	<section class="col-narrow">
		<div class="summary card">
			<p class="sentence">
				You finished <span class="num">{data.doneWeek}</span>
				{data.doneWeek === 1 ? 'thing' : 'things'} this week{#if data.habits[0]}, and your
					<em>{data.habits[0].title.toLowerCase()}</em> streak is
					<span class="num fire"><Flame size={13} aria-hidden="true" />{data.habits[0].streak}</span>{/if}.
			</p>

			<div class="bars">
				{#each data.areas as a (a.area)}
					<div class="bar-row">
						<span class="lbl"><span class="dot {a.area}"></span>{AREA_LABEL[a.area]}</span>
						<span class="track"
							><span class="fill {a.area}" style="width: {((a.open + a.week) / maxOpen) * 100}%"
								><span class="donepart" style="width: {a.open + a.week ? (a.week / (a.open + a.week)) * 100 : 0}%"></span></span
							></span
						>
						<span class="val">{a.week}/{a.open + a.week}</span>
					</div>
				{/each}
				<p class="bar-hint">done this week / total · per area</p>
			</div>
		</div>

		{#if data.habits.length}
			<div class="habits pastel-sky">
				<h3>Habits <em>— daily</em></h3>
				{#each data.habits as h (h.id)}
					<form
					method="POST"
					action="?/habit"
					use:enhance={({ submitter }) => {
						if (!h.done_today) burst(submitter);
						return async ({ update }) => update();
					}}
				>
						<input type="hidden" name="id" value={h.id} />
						<button class="habit" class:on={h.done_today} aria-pressed={h.done_today}>
							<span class="hcheck">{#if h.done_today}<Check size={16} strokeWidth={3} aria-hidden="true" />{/if}</span>
							<span class="hname">{h.title}</span>
							<span class="streak" title="Days in a row"><Flame size={14} aria-hidden="true" />{h.streak}</span>
						</button>
					</form>
				{/each}
			</div>
		{/if}
	</section>
</div>

<!-- GITHUB-STYLE HEATMAP -->
<div class="heatwrap">
	<Heatmap activity={data.activity} />
</div>

<style>
	/* hero */
	.headline {
		position: relative;
		min-width: 0;
	}
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 340px;
		gap: 20px;
		align-items: stretch;
	}
	.hello {
		margin: 0 0 14px;
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-muted);
	}
	h1 {
		font-size: clamp(54px, 13vw, 116px);
		font-weight: 800;
		font-stretch: 75%;
		line-height: 0.92;
		letter-spacing: -0.04em;
	}
	h1 em {
		display: inline-block;
		font-size: 1.12em;
		letter-spacing: -0.02em;
		transform: rotate(-4deg) translateY(6px);
	}
	.sticker {
		display: inline-block;
		margin-left: 0.08em;
		padding: 0.02em 0.16em 0.06em;
		border: 3px solid var(--ink);
		border-radius: 0.22em;
		background: var(--self);
		color: #121212;
		font-stretch: 100%;
		font-weight: 300;
		letter-spacing: -0.05em;
		transform: rotate(3deg);
		box-shadow: 5px 5px 0 var(--ink);
		transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.sticker:hover {
		transform: rotate(-2deg) scale(1.04);
	}
	.ast {
		display: inline-grid;
		place-items: center;
		width: 0.9em;
		height: 0.9em;
		margin-right: 0.08em;
		border-radius: 50%;
		background: var(--lime);
		color: #121212;
		font-size: 0.8em;
		vertical-align: 0.04em;
		animation: spin 18s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.lead {
		max-width: 42ch;
		margin: 20px 0 0;
		color: var(--text-muted);
	}
	.slots {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 22px;
	}
	.plus {
		font-size: 54px;
		font-weight: 700;
		line-height: 0.8;
		color: color-mix(in srgb, var(--text-muted) 40%, transparent);
		transition: color 300ms ease;
	}
	.plus.on {
		color: var(--ink);
	}
	.slot-text {
		margin-left: 10px;
		font-size: 13px;
		color: var(--text-muted);
	}

	.focus {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
		padding: 26px;
		border-radius: 28px;
		overflow: hidden;
	}
	.focus .chip {
		border-color: #121212;
	}
	.focus-text {
		margin: 0;
		font-size: 34px;
		line-height: 1.05;
		max-width: 12ch;
	}
	.quote {
		position: relative;
		width: 100%;
		margin-top: auto;
		padding: 18px 0 0;
		border-top: 2px dashed rgb(18 18 18 / 0.25);
	}
	.qmark {
		position: absolute;
		top: -6px;
		left: -6px;
		font-family: 'Instrument Serif', serif;
		font-size: 90px;
		line-height: 1;
		color: var(--build);
		-webkit-text-stroke: 2px #121212;
		pointer-events: none;
	}
	.qbody {
		position: relative;
		padding-top: 22px;
		animation: pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes pop {
		from {
			opacity: 0;
			transform: scale(0.92) rotate(-2deg);
		}
	}
	.noquote {
		margin: 24px 0 0;
		font-size: 15px;
	}
	.qbar {
		display: flex;
		justify-content: flex-end;
		gap: 6px;
		margin-top: 10px;
	}
	.qbtn {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		border: 1.5px solid #121212;
		background: transparent;
		color: #121212;
		cursor: pointer;
		transition:
			background 160ms ease,
			color 160ms ease,
			transform 300ms ease;
	}
	.qbtn:hover {
		background: #121212;
		color: #fff;
		transform: rotate(-12deg);
	}
	.badge {
		position: absolute;
		right: -6px;
		top: -6px;
		width: 104px;
		height: 104px;
		fill: #121212;
		animation: spin 24s linear infinite;
		opacity: 0.85;
	}
	.badge text {
		font-size: 8.5px;
		font-weight: 700;
		font-family: var(--font-mono);
	}
	.focus .btn {
		position: relative;
		z-index: 1;
		background: #121212;
		border-color: #121212;
		color: #fff;
	}

	/* late */
	.section-title.late {
		color: var(--danger);
	}
	.decide {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		margin-top: 12px;
	}
	.newdate {
		display: flex;
		gap: 6px;
	}
	.input.small {
		min-height: 32px;
		padding: 2px 10px;
		font-size: 13px;
		background: var(--surface);
	}

	/* three */
	.three {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 16px;
		margin-top: 40px;
	}
	.slot-empty {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: flex-start;
		min-height: 300px;
		padding: 22px;
		border-radius: 28px;
		border: 2px dashed var(--border);
		color: var(--text-muted);
	}
	.big-plus {
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		margin-bottom: auto;
		border-radius: 50%;
		background: var(--surface);
		color: var(--text);
	}
	.slot-empty p {
		margin: 0;
		font-size: 22px;
		color: var(--text);
	}
	.slot-empty .small {
		margin-top: 4px;
		font-size: 14px;
		color: var(--text-muted);
	}
	.full {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 16px 0 0;
		color: var(--text-muted);
		font-size: 14px;
	}

	/* bento */
	.bento {
		display: grid;
		grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
		gap: 20px;
		align-items: start;
	}
	.col-narrow {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 40px;
	}
	.more {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		margin-top: 14px;
		font-size: 14px;
		font-weight: 500;
	}
	.calm {
		position: relative;
		padding: 28px;
		min-height: 160px;
		overflow: hidden;
	}
	.calm p {
		max-width: 30ch;
		margin: 0;
		font-size: 18px;
	}
	:global(.calm .arc) {
		position: absolute;
		right: 16px;
		bottom: -10px;
		width: 120px;
		color: var(--text);
		opacity: 0.85;
	}

	.summary {
		padding: 24px;
	}
	.sentence {
		margin: 0;
		font-size: 21px;
		line-height: 1.45;
		letter-spacing: -0.015em;
	}
	.num {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 0 8px;
		border-radius: 8px;
		border: 1.5px solid var(--border);
		font-size: 15px;
		font-weight: 700;
		vertical-align: 0.15em;
		line-height: 1.6;
	}
	.num.fire {
		color: #c2410c;
		background: #ffedd5;
		border-color: #fed7aa;
	}
	.bars {
		margin-top: 22px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.bar-row {
		display: grid;
		grid-template-columns: 96px 1fr 40px;
		align-items: center;
		gap: 10px;
		font-size: 13px;
	}
	.lbl {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
	}
	.track {
		height: 10px;
		border-radius: 999px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.fill {
		display: block;
		height: 100%;
		border-radius: 999px;
		opacity: 0.55;
		position: relative;
	}
	.fill.study { background: var(--study); }
	.fill.build { background: var(--build); }
	.fill.life { background: var(--life); }
	.fill.self { background: var(--self); }
	.donepart {
		position: absolute;
		inset: 0 auto 0 0;
		border-radius: 999px;
		background: #121212;
	}
	.val {
		text-align: right;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}
	.bar-hint {
		margin: 0;
		font-size: 11px;
		color: var(--text-muted);
	}

	.habits {
		padding: 22px;
		border-radius: 28px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.habits h3 {
		font-size: 20px;
		font-weight: 600;
	}
	.habit {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		min-height: 52px;
		padding: 8px 16px 8px 8px;
		border: 0;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.6);
		color: #121212;
		cursor: pointer;
		font-weight: 600;
		text-align: left;
		transition: background 180ms ease;
	}
	.habit:hover {
		background: #fff;
	}
	.hcheck {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 2px dashed #121212;
	}
	.habit.on .hcheck {
		border-style: solid;
		background: #121212;
		color: #fff;
	}
	.hname {
		flex: 1;
	}
	.streak {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		color: #c2410c;
	}

	.heatwrap {
		margin-top: 40px;
	}

	@media (max-width: 980px) {
		.hero,
		.bento {
			grid-template-columns: 1fr;
		}
		.three {
			grid-template-columns: 1fr;
		}
		.tcard,
		.slot-empty {
			min-height: 220px;
		}
	}
</style>
