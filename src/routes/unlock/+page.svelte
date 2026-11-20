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


<div class="lock" class:opening>
	<div class="glass" aria-hidden="true"></div>

	<div class="stack">
	{#if playing}
		<section class="card game" aria-label="Mini game">
			<SnakeGame />
		</section>
	{:else}
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
					setTimeout(() => goto(next, { invalidateAll: true }), reduced() ? 250 : 800);
				} else if (result.type === 'redirect') {
					opening = true;
					setTimeout(() => goto(result.location, { invalidateAll: true }), reduced() ? 250 : 800);
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
	{/if}

	{#if !opening}
		<button type="button" class="toggle" onclick={() => (playing = !playing)}>
			{playing ? '🔒 balik masuk PIN' : '🐍 bosan? main game'}
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

	/* one seamless frosted pane; on unlock a zero-width gap in the middle
	   widens outward (clip-path), so it still "splits open" with no seam at rest */
	.glass {
		position: absolute;
		inset: 0;
		background: color-mix(in srgb, var(--bg) 55%, transparent);
		backdrop-filter: blur(28px) saturate(1.1);
		-webkit-backdrop-filter: blur(28px) saturate(1.1);
		clip-path: polygon(0 0, 50% 0, 50% 100%, 50% 100%, 50% 0, 100% 0, 100% 100%, 0 100%);
		transition: clip-path 800ms cubic-bezier(0.7, 0, 0.2, 1);
	}
	.opening .glass {
		clip-path: polygon(0 0, 0 0, 0 100%, 100% 100%, 100% 0, 100% 0, 100% 100%, 0 100%);
	}

	.stack {
		position: relative;
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
	.card.game {
		padding: 20px 18px 16px;
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
		transform: scale(1.12);
		opacity: 0;
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
		.opening .glass {
			clip-path: none;
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
