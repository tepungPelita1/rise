<script lang="ts">
	// Draggable, spinning stickers + Buddy. Positions are remembered in this browser.
	import { onMount } from 'svelte';
	import Deco from './Deco.svelte';
	import Buddy from './Buddy.svelte';

	interface Props {
		lines?: string[];
		mood?: number;
	}
	let { lines = [], mood = 0 }: Props = $props();

	type Kind = 'flower' | 'asterisk' | 'star' | 'loop' | 'arc' | 'buddy' | 'smile';
	interface Sticker {
		id: string;
		kind: Kind;
		color: string;
		size: number;
		x: number; // % of box
		y: number; // % of box
		anim: 'spin' | 'float' | 'wobble' | 'none';
	}

	const START: Sticker[] = [
		{ id: 'buddy', kind: 'buddy', color: '', size: 130, x: 44, y: 38, anim: 'none' },
		{ id: 'flower', kind: 'flower', color: 'var(--life)', size: 78, x: 6, y: 8, anim: 'spin' },
		{ id: 'star', kind: 'star', color: 'var(--study)', size: 62, x: 80, y: 4, anim: 'float' },
		{ id: 'ast', kind: 'asterisk', color: 'var(--build)', size: 56, x: 12, y: 70, anim: 'spin' },
		{ id: 'smile', kind: 'smile', color: 'var(--lime)', size: 64, x: 82, y: 66, anim: 'wobble' },
		{ id: 'arc', kind: 'arc', color: 'var(--ink)', size: 64, x: 40, y: -4, anim: 'float' }
	];

	const KEY = 'rise-stickers';
	let stickers = $state<Sticker[]>(structuredClone(START));
	let box: HTMLDivElement | undefined = $state();
	let drag: { id: string; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null = null;
	let dragging = $state<string | null>(null);
	let spun = $state<Record<string, number>>({});

	onMount(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Record<string, { x: number; y: number }> | null;
			if (saved) for (const s of stickers) if (saved[s.id]) Object.assign(s, saved[s.id]);
		} catch {}
	});

	function save() {
		try {
			localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(stickers.map((s) => [s.id, { x: s.x, y: s.y }]))));
		} catch {}
	}

	let buddy: Buddy | undefined = $state();

	function down(e: PointerEvent, s: Sticker) {
		if (e.button !== 0) return;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		drag = { id: s.id, sx: e.clientX, sy: e.clientY, ox: s.x, oy: s.y, moved: false };
		dragging = s.id;
	}

	function move(e: PointerEvent) {
		if (!drag || !box) return;
		const b = box.getBoundingClientRect();
		const s = stickers.find((x) => x.id === drag!.id)!;
		const dx = ((e.clientX - drag.sx) / b.width) * 100;
		const dy = ((e.clientY - drag.sy) / b.height) * 100;
		if (Math.abs(dx) + Math.abs(dy) > 0.5) drag.moved = true;
		s.x = Math.max(-10, Math.min(95, drag.ox + dx));
		s.y = Math.max(-10, Math.min(95, drag.oy + dy));
	}

	function up(s: Sticker) {
		if (!drag) return;
		// a click without dragging: buddy talks, stickers do a fast spin
		if (!drag.moved) {
			if (s.kind === 'buddy') buddy?.poke();
			else spun[s.id] = (spun[s.id] ?? 0) + 1;
		}
		drag = null;
		dragging = null;
		save();
	}

	function reset() {
		stickers = structuredClone(START);
		try {
			localStorage.removeItem(KEY);
		} catch {}
	}
</script>

<div class="playground" bind:this={box}>
	{#each stickers as s (s.id)}
		<div
			class="sticker"
			class:dragging={dragging === s.id}
			style="left: {s.x}%; top: {s.y}%; width: {s.size}px; --c: {s.color}"
			onpointerdown={(e) => down(e, s)}
			onpointermove={move}
			onpointerup={() => up(s)}
			role="presentation"
		>
			{#if s.kind === 'buddy'}
				<Buddy {lines} {mood} bind:this={buddy} />
			{:else}
				{#key spun[s.id]}
					<div class="inner {s.anim}" class:spun={spun[s.id]}>
						{#if s.kind === 'smile'}
							<svg viewBox="0 0 100 100" aria-hidden="true">
								<circle cx="50" cy="50" r="46" fill="var(--c)" stroke="#121212" stroke-width="5" />
								<circle cx="36" cy="40" r="6" fill="#121212" />
								<circle cx="64" cy="40" r="6" fill="#121212" />
								<path d="M30 60 Q50 80 70 60" fill="none" stroke="#121212" stroke-width="6" stroke-linecap="round" />
							</svg>
						{:else}
							<div class="shape" style="color: {s.color}">
								<Deco kind={s.kind} />
							</div>
						{/if}
					</div>
				{/key}
			{/if}
		</div>
	{/each}
	<button class="reset" onclick={reset} title="Put stickers back">reset stickers</button>
	<span class="hint">drag anything · click buddy</span>
</div>

<style>
	.playground {
		position: absolute;
		inset: 0 0 0 52%;
		user-select: none;
	}
	.sticker {
		position: absolute;
		touch-action: none;
		cursor: grab;
		transform: translate(-0%, -0%);
		filter: drop-shadow(4px 4px 0 #121212);
		transition: filter 150ms ease;
	}
	.sticker.dragging {
		cursor: grabbing;
		z-index: 4;
		filter: drop-shadow(8px 10px 0 #121212);
	}
	.shape :global(svg) {
		width: 100%;
		height: auto;
	}
	/* white outline so shapes read like die-cut stickers */
	.shape {
		filter: drop-shadow(0 0 0 #fff) drop-shadow(2px 0 0 #121212) drop-shadow(-2px 0 0 #121212) drop-shadow(0 2px 0 #121212) drop-shadow(0 -2px 0 #121212);
	}
	.inner.spin {
		animation: spin 12s linear infinite;
	}
	.inner.float {
		animation: float 4s ease-in-out infinite;
	}
	.inner.wobble {
		animation: wobble 2.6s ease-in-out infinite;
	}
	.inner.spun {
		animation: whirl 700ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes spin { to { transform: rotate(360deg); } }
	@keyframes float {
		0%, 100% { transform: translateY(0) rotate(-6deg); }
		50% { transform: translateY(-12px) rotate(6deg); }
	}
	@keyframes wobble {
		0%, 100% { transform: rotate(-10deg) scale(1); }
		50% { transform: rotate(10deg) scale(1.08); }
	}
	@keyframes whirl {
		from { transform: rotate(0) scale(0.8); }
		to { transform: rotate(720deg) scale(1); }
	}
	.reset,
	.hint {
		position: absolute;
		bottom: -6px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-muted);
	}
	.reset {
		right: 0;
		border: 0;
		background: none;
		padding: 0;
		text-decoration: underline;
		cursor: pointer;
	}
	.hint {
		left: 0;
	}

	@media (max-width: 980px) {
		.playground {
			position: relative;
			inset: auto;
			height: 200px;
			margin-top: 20px;
		}
		.sticker {
			scale: 0.78;
			transform-origin: top left;
		}
	}
</style>
