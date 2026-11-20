<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import type { PageProps } from './$types';
	import SnakeGame from '#lib/components/SnakeGame.svelte';

	let { data }: PageProps = $props();

	let pin = $state('');
	let remember = $state(true);
	let message = $state('');
	let shaking = $state(false);
	let opening = $state(false);
	let busy = $state(false);
	let retryAt = $state<number | null>(null);
	let now = $state(Date.now());
	let input: HTMLInputElement | undefined = $state();
	let form: HTMLFormElement | undefined = $state();
	let playing = $state(false);
	let stack: HTMLDivElement | undefined = $state();

	$effect(() => {
		retryAt = data.retryAt;
	});

	const lockedOut = $derived(retryAt !== null && retryAt > now);
	const countdown = $derived.by(() => {
		if (!lockedOut || retryAt === null) return '';
		const s = Math.ceil((retryAt - now) / 1000);
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		const sec = s % 60;
		return h > 0 ? `${h}h ${m}m` : `${m}:${String(sec).padStart(2, '0')}`;
	});

	$effect(() => {
		if (!lockedOut) return;
		const t = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(t);
	});

	$effect(() => {
		if (!lockedOut && !opening) input?.focus();
	});

	function onInput() {
		pin = pin.replace(/\D/g, '').slice(0, data.pinLength);
		message = '';
		if (pin.length === data.pinLength && !busy) form?.requestSubmit();
	}

	async function shake(msg: string) {
		message = msg;
		pin = '';
		shaking = false;
		await tick();
		shaking = true;
		input?.focus();
	}

	const reduced = () =>
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>


<div class="lock" class:opening class:playing>
	<!-- one seamless pane at rest; two halves only exist while it splits open -->
	<div class="glass full" aria-hidden="true"></div>
	{#if opening}
		<div class="glass half left" aria-hidden="true"></div>
		<div class="glass half right" aria-hidden="true"></div>
		<div class="burst" aria-hidden="true">
			{#each Array.from({ length: 14 }, (_, i) => i) as i (i)}
				<span style="--a: {i * (360 / 14)}deg; --c: var({['--study', '--sky', '--life', '--self', '--lime', '--build', '--blob-4'][i % 7]})"></span>
			{/each}
		</div>
	{/if}

	{#if playing && !opening}
		<SnakeGame island={stack} />
	{/if}

	<div class="stack" bind:this={stack}>
	<form
		bind:this={form}
		class="card"
		class:shaking
		method="POST"
		action="?/unlock"
		onanimationend={() => (shaking = false)}
		use:enhance={() => {
			busy = true;
			return async ({ result }) => {
				busy = false;
				if (result.type === 'success') {
					const next = (result.data?.next as string) ?? '/';
					opening = true;
					setTimeout(() => goto(next, { invalidateAll: true }), reduced() ? 250 : 1000);
				} else if (result.type === 'redirect') {
					opening = true;
					setTimeout(() => goto(result.location, { invalidateAll: true }), reduced() ? 250 : 1000);
				} else if (result.type === 'failure') {
					const d = result.data as { message?: string; retryAt?: number } | undefined;
					if (d?.retryAt) {
						retryAt = d.retryAt;
						now = Date.now();
						pin = '';
						message = '';
					} else {
						await shake(d?.message ?? 'Wrong PIN.');
					}
				} else {
					await shake('Something went wrong. Try again.');
				}
			};
		}}
	>
		<span class="tag">RISE · LOCKED</span>

		<svg class="star" viewBox="0 0 24 24" aria-hidden="true">
			<path d="M12 1.5l2.6 6.6 7.1.5-5.4 4.6 1.7 6.9L12 16.3 6 20.1l1.7-6.9L2.3 8.6l7.1-.5z" />
		</svg>

		<h1>Enter PIN to see progress, <em>tepungPelita</em></h1>

		{#if !data.configured}
			<p class="note">PIN is not set up on the server yet.</p>
		{:else}
			<label class="pinwrap" class:disabled={lockedOut}>
				<span class="sr-only">{data.pinLength}-digit PIN</span>
				<input
					bind:this={input}
					bind:value={pin}
					oninput={onInput}
					name="pin"
					type="password"
					inputmode="numeric"
					pattern="[0-9]*"
					maxlength={data.pinLength}
					autocomplete="off"
					disabled={lockedOut || opening}
					aria-invalid={message ? 'true' : undefined}
					aria-describedby="pin-msg"
				/>
				<span class="boxes" aria-hidden="true">
					{#each Array.from({ length: data.pinLength }, (_, i) => i) as i (i)}
						<span class="box b{i}" class:filled={pin.length > i} class:current={pin.length === i && !lockedOut}>
							{#if pin.length > i}<span class="dot"></span>{/if}
						</span>
					{/each}
				</span>
			</label>

			<p id="pin-msg" class="msg" class:error={!!message || lockedOut} role="status" aria-live="polite">
				{#if lockedOut}
					Too many tries. Try again in <strong>{countdown}</strong>
				{:else if message}
					{message}
				{:else if opening}
					Opening…
				{:else}
					&nbsp;
				{/if}
			</p>

			<label class="remember">
				<input type="checkbox" name="remember" bind:checked={remember} />
				<span>Remember this device</span>
			</label>
		{/if}
	</form>

	{#if !opening}
		<button type="button" class="toggle" class:stop={playing} onclick={() => (playing = !playing)}>
			{playing ? 'stop' : 'start'}
		</button>
	{/if}
	</div>
</div>

<style>
	.lock {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: grid;
		place-items: center;
		padding: 16px;
		overflow: hidden;
	}

	/* frosted glass: one seamless pane at rest. On unlock it is swapped for two
	   halves that slam apart like doors (the seam only exists while they move). */
	.glass {
		position: absolute;
		inset: 0;
		background: color-mix(in srgb, var(--bg) 55%, transparent);
		backdrop-filter: blur(28px) saturate(1.1);
		-webkit-backdrop-filter: blur(28px) saturate(1.1);
	}
	.opening .glass.full {
		display: none;
	}
	.glass.half {
		right: auto;
		width: 50%;
		box-shadow: 0 0 40px rgb(18 18 18 / 0.12);
		animation: door-l 900ms cubic-bezier(0.75, 0, 0.15, 1) 120ms forwards;
	}
	.glass.half.right {
		left: 50%;
		animation-name: door-r;
	}
	@keyframes door-l {
		0% { transform: translateX(0); }
		18% { transform: translateX(1.5%); }
		100% { transform: translateX(-105%) skewX(-4deg); }
	}
	@keyframes door-r {
		0% { transform: translateX(0); }
		18% { transform: translateX(-1.5%); }
		100% { transform: translateX(105%) skewX(4deg); }
	}

	/* pastel confetti burst from the card */
	.burst {
		position: absolute;
		left: 50%;
		top: 50%;
		z-index: 2;
		pointer-events: none;
	}
	.burst span {
		position: absolute;
		width: 14px;
		height: 14px;
		margin: -7px;
		border-radius: 4px;
		background: var(--c);
		border: 2px solid var(--ink);
		animation: burst 900ms cubic-bezier(0.2, 0.8, 0.3, 1) 80ms both;
	}
	.burst span:nth-child(odd) {
		border-radius: 50%;
	}
	@keyframes burst {
		0% { transform: rotate(var(--a)) translateY(0) scale(0.2); opacity: 1; }
		70% { opacity: 1; }
		100% { transform: rotate(var(--a)) translateY(-46vmin) scale(1) rotate(200deg); opacity: 0; }
	}

	.stack {
		position: relative;
		z-index: 1;
		display: grid;
		justify-items: center;
		gap: 12px;
		width: min(360px, 100%);
	}
	.toggle {
		padding: 10px 18px;
		border-radius: 999px;
		border: 2px solid var(--ink);
		background: var(--lime);
		color: var(--on-pastel);
		font-family: var(--font-mono);
		font-size: 13px;
		cursor: pointer;
		box-shadow: 3px 3px 0 var(--ink);
		transition: transform 120ms ease, box-shadow 120ms ease;
	}
	.toggle:hover {
		transform: translate(-1px, -1px);
		box-shadow: 4px 4px 0 var(--ink);
	}
	.toggle:active {
		transform: translate(2px, 2px);
		box-shadow: 1px 1px 0 var(--ink);
	}
	.toggle {
		min-width: 96px;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-weight: 700;
	}
	.toggle.stop {
		background: var(--self);
	}
	.card {
		position: relative;
		width: min(360px, 100%);
		padding: 26px 22px 20px;
		border-radius: 28px;
		background: color-mix(in srgb, var(--surface) 70%, transparent);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-lift);
		text-align: center;
		transition:
			transform 600ms cubic-bezier(0.3, 1.4, 0.5, 1),
			opacity 500ms ease;
	}
	.opening .card {
		animation: card-out 700ms cubic-bezier(0.5, 0, 0.3, 1) forwards;
	}
	@keyframes card-out {
		0% { transform: scale(1); }
		25% { transform: scale(1.08) rotate(-2deg); opacity: 1; }
		100% { transform: scale(0.4) translateY(-30px) rotate(6deg); opacity: 0; }
	}
	.card.shaking {
		animation: shake 420ms ease;
	}
	@keyframes shake {
		20%, 60% { transform: translateX(-10px); }
		40%, 80% { transform: translateX(10px); }
	}

	.tag {
		display: inline-block;
		padding: 5px 12px;
		border-radius: 999px;
		background: var(--ink);
		color: var(--on-ink);
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.12em;
	}
	.star {
		display: block;
		width: 34px;
		height: 34px;
		margin: 14px auto 8px;
		fill: var(--ink);
		animation: spin 14s linear infinite;
	}
	.opening .star {
		animation: spin 0.8s cubic-bezier(0.5, 0, 0.2, 1) 1;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	h1 {
		margin: 0 0 18px;
		font-family: var(--font-display);
		font-weight: 800;
		font-stretch: 80%;
		font-size: clamp(22px, 5.5vw, 27px);
		line-height: 1.05;
		letter-spacing: -0.03em;
	}
	h1 em {
		font-family: var(--font-serif);
		font-weight: 400;
		font-style: italic;
		letter-spacing: 0;
	}

	.pinwrap {
		position: relative;
		display: block;
		width: fit-content;
		margin: 0 auto;
		cursor: text;
	}
	.pinwrap input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		font-size: 16px; /* no iOS zoom */
		caret-color: transparent;
	}
	.boxes {
		display: flex;
		gap: clamp(5px, 1.6vw, 7px);
	}
	.box {
		display: grid;
		place-items: center;
		width: clamp(36px, 10vw, 42px);
		height: clamp(46px, 13vw, 52px);
		border-radius: 13px;
		border: 2px solid var(--border);
		background: var(--surface);
		transition:
			transform 160ms ease,
			border-color 160ms ease,
			background 160ms ease;
	}
	.box.current {
		border-color: var(--ink);
	}
	.box.filled {
		transform: translateY(-3px);
		border-color: var(--ink);
	}
	.b0.filled { background: var(--study); }
	.b1.filled { background: var(--sky); }
	.b2.filled { background: var(--life); }
	.b3.filled { background: var(--self); }
	.b4.filled { background: var(--lime); }
	.b5.filled { background: var(--blob-4); }
	.dot {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		background: var(--on-pastel);
		animation: pop 180ms ease;
	}
	@keyframes pop {
		from { transform: scale(0); }
	}
	.pinwrap.disabled .box {
		opacity: 0.45;
	}

	.msg {
		min-height: 1.4em;
		margin: 12px 0 6px;
		font-size: 14px;
		color: var(--text-muted);
	}
	.msg.error {
		color: var(--danger);
	}
	.note {
		margin: 0 0 8px;
		color: var(--danger);
	}
	.remember {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: var(--text-muted);
		cursor: pointer;
	}
	.remember input {
		width: 16px;
		height: 16px;
		accent-color: var(--ink);
	}

	@media (prefers-reduced-motion: reduce) {
		.glass,
		.card {
			transition: opacity 250ms ease;
		}
		.glass.half,
		.burst,
		.opening .card {
			animation: none;
		}
		.opening .glass.half {
			display: none;
		}
		.opening .card {
			opacity: 0;
		}
		.opening .card {
			transform: none;
		}
		.star,
		.opening .star,
		.card.shaking {
			animation: none;
		}
	}
</style>
