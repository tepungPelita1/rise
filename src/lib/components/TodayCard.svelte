<script lang="ts">
	import { enhance } from '$app/forms';
	import { celebrateBig } from '#lib/celebrate.ts';
	import { ArrowUpRight, Check, CalendarDays, Repeat } from '@lucide/svelte';
	import Deco from './Deco.svelte';
	import { AREA_LABEL, type Area, type Item } from '#lib/types.ts';
	import { dueHint, niceDate, todayISO } from '#lib/dates.ts';

	let { item, index }: { item: Item; index: number } = $props();

	const DECO: Record<Area, 'loop' | 'flower' | 'asterisk' | 'star'> = {
		study: 'loop',
		build: 'flower',
		life: 'asterisk',
		self: 'star'
	};
	const DECO_COLOR: Record<Area, string> = {
		study: 'var(--lime)',
		build: 'var(--life)',
		life: 'var(--study)',
		self: 'var(--sky)'
	};

	let area = $derived<Area>(item.area ?? 'life');
	const today = todayISO();

	// 3D tilt that follows the mouse
	let rx = $state(0);
	let ry = $state(0);
	let gx = $state(50);
	let gy = $state(50);
	function tilt(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const px = (e.clientX - r.left) / r.width;
		const py = (e.clientY - r.top) / r.height;
		ry = (px - 0.5) * 14;
		rx = (0.5 - py) * 12;
		gx = px * 100;
		gy = py * 100;
	}
	function untilt() {
		rx = ry = 0;
		gx = gy = 50;
	}
</script>

<article
	class="tcard pastel-{area}"
	style="--rx: {rx}deg; --ry: {ry}deg; --gx: {gx}%; --gy: {gy}%"
	onpointermove={tilt}
	onpointerleave={untilt}
>
	<div class="decobox" style="color: {DECO_COLOR[area]}">
		<Deco kind={DECO[area]} />
	</div>

	<header>
		<span class="chip">{String(index + 1).padStart(2, '0')} · {AREA_LABEL[area]}</span>
		<a class="round" href="/item/{item.id}" aria-label="Open “{item.title}”"><ArrowUpRight size={18} /></a>
	</header>

	<h3>{item.title}</h3>
	{#if item.goal_title}<p class="sub"><em>{item.goal_title}</em></p>{/if}

	<div class="meta">
		{#if item.due}
			<span><CalendarDays size={14} aria-hidden="true" /> {niceDate(item.due, today)} · {dueHint(item.due, today)}</span>
		{/if}
		{#if item.repeat !== 'none'}
			<span><Repeat size={14} aria-hidden="true" /> {item.repeat}</span>
		{/if}
	</div>

	<footer>
		<form method="POST" action="?/done" use:enhance={celebrateBig}>
			<input type="hidden" name="id" value={item.id} />
			<button class="done"><Check size={16} strokeWidth={3} aria-hidden="true" /> Done</button>
		</form>
		<form method="POST" action="?/unpick" use:enhance>
			<input type="hidden" name="id" value={item.id} />
			<button class="later">Not today</button>
		</form>
	</footer>
</article>

<style>
	.tcard {
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 300px;
		padding: 22px;
		border-radius: 28px;
		overflow: hidden;
		isolation: isolate;
		border: 3px solid #121212;
		box-shadow: 6px 6px 0 #121212;
		transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry));
		transition:
			transform 160ms ease-out,
			box-shadow 220ms ease;
	}
	.tcard:hover {
		box-shadow: 10px 12px 0 #121212;
	}
	/* halftone dots + a shine that follows the mouse */
	.tcard::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -2;
		background: radial-gradient(circle, rgb(18 18 18 / 0.16) 1.4px, transparent 1.8px) 0 0 / 12px 12px;
		mask-image: linear-gradient(160deg, transparent 35%, #000 100%);
	}
	.tcard::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		background: radial-gradient(circle at var(--gx) var(--gy), rgb(255 255 255 / 0.55), transparent 45%);
		opacity: 0;
		transition: opacity 200ms ease;
		pointer-events: none;
	}
	.tcard:hover::after {
		opacity: 1;
	}
	.decobox {
		position: absolute;
		right: -26px;
		bottom: -30px;
		width: 150px;
		height: 150px;
		z-index: -1;
		transition: transform 600ms ease;
	}
	.tcard:hover .decobox {
		transform: rotate(25deg) scale(1.05);
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	h3 {
		margin-top: 28px;
		font-size: 28px;
		font-weight: 600;
		line-height: 1.08;
		overflow-wrap: anywhere;
	}
	.sub {
		margin: 6px 0 0;
		font-size: 22px;
		line-height: 1.1;
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 14px;
		font-size: 13px;
		font-weight: 500;
	}
	.meta span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	footer {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: auto;
		padding-top: 24px;
	}
	.done {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 42px;
		padding: 0 18px;
		border: 0;
		border-radius: 999px;
		background: #121212;
		color: #fff;
		font-weight: 600;
		cursor: pointer;
		transition: transform 160ms ease;
	}
	.done:hover {
		transform: scale(1.04);
	}
	.later {
		min-height: 42px;
		padding: 0 12px;
		border: 0;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.45);
		color: #121212;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
	}
	.later:hover {
		background: rgb(255 255 255 / 0.75);
	}
	:global(.tcard .round:hover) {
		color: #fff;
	}
</style>
