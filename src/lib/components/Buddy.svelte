<script lang="ts">
	// A little sticker buddy. Eyes follow the mouse, blinks, jumps + talks when clicked.
	import { onMount } from 'svelte';

	interface Props {
		lines?: string[];
		/** how many tasks are done today: buddy gets happier */
		mood?: number;
	}
	let { lines = [], mood = 0 }: Props = $props();

	const DEFAULT = [
		'pick three. just three.',
		'you got this 💪',
		'one step at a time',
		'check your deadlines 👀',
		'drink water lah',
		'stop scrolling. tick one.',
		'proud of you fr',
		'lock in.'
	];

	let leftEye: HTMLSpanElement | undefined = $state();
	let rightEye: HTMLSpanElement | undefined = $state();
	let l = $state({ x: 0, y: 0 });
	let r = $state({ x: 0, y: 0 });
	let blink = $state(false);
	let jumping = $state(false);
	let says = $state('');
	let sayTimer: ReturnType<typeof setTimeout>;
	let clicks = 0;

	function look(eye: HTMLSpanElement | undefined, px: number, py: number) {
		if (!eye) return { x: 0, y: 0 };
		const b = eye.getBoundingClientRect();
		const dx = px - (b.left + b.width / 2);
		const dy = py - (b.top + b.height / 2);
		const a = Math.atan2(dy, dx);
		const d = Math.min(7, Math.hypot(dx, dy) / 18);
		return { x: Math.cos(a) * d, y: Math.sin(a) * d };
	}

	function onMove(e: PointerEvent) {
		l = look(leftEye, e.clientX, e.clientY);
		r = look(rightEye, e.clientX, e.clientY);
	}

	export function poke() {
		clicks++;
		jumping = false;
		requestAnimationFrame(() => (jumping = true));
		const pool = [...lines, ...DEFAULT];
		says = clicks > 6 && clicks % 7 === 0 ? 'ok stop poking me 😤' : pool[Math.floor(Math.random() * pool.length)];
		clearTimeout(sayTimer);
		sayTimer = setTimeout(() => (says = ''), 3200);
	}

	onMount(() => {
		let t: ReturnType<typeof setTimeout>;
		const loop = () => {
			t = setTimeout(
				() => {
					blink = true;
					setTimeout(() => (blink = false), 140);
					loop();
				},
				2500 + Math.random() * 3500
			);
		};
		loop();
		return () => clearTimeout(t);
	});
</script>

<svelte:window onpointermove={onMove} />

<div class="buddy-wrap">
	{#if says}
		<div class="bubble" role="status">{says}</div>
	{/if}
	<button
		class="buddy"
		class:jump={jumping}
		class:happy={mood > 0}
		onclick={poke}
		onanimationend={() => (jumping = false)}
		aria-label="Buddy — click for a pep talk"
		title="poke me"
	>
		<svg class="hair" viewBox="0 0 60 30" aria-hidden="true">
			<path d="M8 28 C 4 10, 18 2, 22 16 C 24 0, 40 0, 38 16 C 44 4, 58 10, 52 28 Z" />
		</svg>
		<span class="face">
			<span class="eyes">
				<span class="eye" class:blink bind:this={leftEye}>
					<span class="pupil" style="transform: translate({l.x}px, {l.y}px)"></span>
				</span>
				<span class="eye" class:blink bind:this={rightEye}>
					<span class="pupil" style="transform: translate({r.x}px, {r.y}px)"></span>
				</span>
			</span>
			<span class="cheeks"><span></span><span></span></span>
			<span class="mouth"></span>
		</span>
		<span class="arm left"></span>
		<span class="arm right"></span>
		<span class="feet"><span></span><span></span></span>
	</button>
</div>

<style>
	.buddy-wrap {
		position: relative;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
	}
	.buddy {
		position: relative;
		width: 118px;
		height: 124px;
		padding: 0;
		border: 3px solid #121212;
		border-radius: 36px 36px 30px 30px;
		background:
			radial-gradient(circle, rgb(255 255 255 / 0.45) 1.5px, transparent 2px) 0 0 / 10px 10px,
			var(--self);
		box-shadow: 6px 6px 0 #121212;
		cursor: pointer;
		animation: bob 3.2s ease-in-out infinite;
		transition: box-shadow 150ms ease;
	}
	.buddy:hover {
		box-shadow: 9px 9px 0 #121212;
	}
	.buddy:active {
		box-shadow: 2px 2px 0 #121212;
	}
	.buddy.jump {
		animation: jump 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes bob {
		0%, 100% { transform: translateY(0) rotate(-3deg); }
		50% { transform: translateY(-8px) rotate(3deg); }
	}
	@keyframes jump {
		0% { transform: translateY(0) scale(1, 1); }
		20% { transform: translateY(4px) scale(1.12, 0.86); }
		55% { transform: translateY(-38px) scale(0.92, 1.1) rotate(-8deg); }
		80% { transform: translateY(0) scale(1.08, 0.92); }
		100% { transform: translateY(0) scale(1, 1); }
	}
	.hair {
		position: absolute;
		top: -24px;
		left: 50%;
		width: 54px;
		transform: translateX(-50%);
		fill: #3b82f6;
		stroke: #121212;
		stroke-width: 3;
		stroke-linejoin: round;
	}
	.face {
		position: absolute;
		inset: 22px 0 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.eyes {
		display: flex;
		gap: 8px;
	}
	.eye {
		display: grid;
		place-items: center;
		width: 34px;
		height: 38px;
		border: 3px solid #121212;
		border-radius: 50%;
		background: #fff;
		overflow: hidden;
		transition: transform 90ms ease;
	}
	.eye.blink {
		transform: scaleY(0.1);
	}
	.pupil {
		width: 15px;
		height: 17px;
		border-radius: 50%;
		background: #121212;
		box-shadow: inset 3px -3px 0 -1px #121212, inset -3px 3px 0 0 rgb(255 255 255 / 0);
		position: relative;
		transition: transform 60ms linear;
	}
	.pupil::after {
		content: '';
		position: absolute;
		top: 3px;
		right: 3px;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #fff;
	}
	.cheeks {
		display: flex;
		gap: 50px;
		margin-top: -2px;
	}
	.cheeks span {
		width: 14px;
		height: 8px;
		border-radius: 50%;
		background: #f43f5e;
		opacity: 0.55;
	}
	.mouth {
		width: 22px;
		height: 10px;
		margin-top: 2px;
		border: 3px solid #121212;
		border-top: 0;
		border-radius: 0 0 14px 14px;
		background: #121212;
		transition: all 200ms ease;
	}
	.buddy:hover .mouth,
	.buddy.happy .mouth {
		width: 28px;
		height: 16px;
		background: #ef4444;
		border-color: #121212;
	}
	.arm {
		position: absolute;
		top: 64px;
		width: 26px;
		height: 8px;
		border: 3px solid #121212;
		border-radius: 8px;
		background: var(--self);
	}
	.arm.left {
		left: -24px;
		transform-origin: right center;
		transform: rotate(20deg);
	}
	.arm.right {
		right: -24px;
		transform-origin: left center;
		transform: rotate(-20deg);
	}
	.buddy:hover .arm.right {
		animation: wave 500ms ease-in-out infinite alternate;
	}
	@keyframes wave {
		from { transform: rotate(-20deg); }
		to { transform: rotate(-70deg); }
	}
	.feet {
		position: absolute;
		bottom: -14px;
		left: 50%;
		display: flex;
		gap: 18px;
		transform: translateX(-50%);
	}
	.feet span {
		width: 26px;
		height: 13px;
		border: 3px solid #121212;
		border-radius: 10px 10px 4px 4px;
		background: #fb923c;
	}
	.bubble {
		position: absolute;
		bottom: calc(100% + 34px);
		left: 50%;
		transform: translateX(-50%);
		width: max-content;
		max-width: 220px;
		padding: 10px 14px;
		border: 3px solid #121212;
		border-radius: 18px;
		background: #fff;
		color: #121212;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 15px;
		line-height: 1.25;
		text-align: center;
		box-shadow: 4px 4px 0 #121212;
		animation: popin 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
		z-index: 3;
	}
	.bubble::after {
		content: '';
		position: absolute;
		bottom: -12px;
		left: 50%;
		width: 18px;
		height: 18px;
		background: #fff;
		border-right: 3px solid #121212;
		border-bottom: 3px solid #121212;
		transform: translateX(-50%) rotate(45deg);
	}
	@keyframes popin {
		from { opacity: 0; transform: translateX(-50%) scale(0.6) translateY(10px); }
	}
</style>
