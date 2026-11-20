<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import type { PageProps } from './$types';

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
		pin = pin.replace(/\D/g, '').slice(0, 4);
		message = '';
		if (pin.length === 4 && !busy) form?.requestSubmit();
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
	<div class="glass left" aria-hidden="true"></div>
	<div class="glass right" aria-hidden="true"></div>

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
				<span class="sr-only">4-digit PIN</span>
				<input
					bind:this={input}
					bind:value={pin}
					oninput={onInput}
					name="pin"
					type="password"
					inputmode="numeric"
					pattern="[0-9]*"
					maxlength="4"
					autocomplete="off"
					disabled={lockedOut || opening}
					aria-invalid={message ? 'true' : undefined}
					aria-describedby="pin-msg"
				/>
				<span class="boxes" aria-hidden="true">
					{#each [0, 1, 2, 3] as i (i)}
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

	/* frosted glass in two halves so it can split open */
	.glass {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 50.5%;
		background: color-mix(in srgb, var(--bg) 45%, transparent);
		backdrop-filter: blur(28px) saturate(1.3);
		-webkit-backdrop-filter: blur(28px) saturate(1.3);
		transition: transform 800ms cubic-bezier(0.7, 0, 0.2, 1);
	}
	.glass.left {
		left: 0;
		border-right: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
	}
	.glass.right {
		right: 0;
	}
	.opening .glass.left {
		transform: translateX(-101%);
	}
	.opening .glass.right {
		transform: translateX(101%);
	}

	.card {
		position: relative;
		width: min(440px, 100%);
		padding: 36px 28px 26px;
		border-radius: 32px;
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
		width: 44px;
		height: 44px;
		margin: 18px auto 10px;
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
		margin: 0 0 22px;
		font-family: var(--font-display);
		font-weight: 800;
		font-stretch: 80%;
		font-size: clamp(26px, 6vw, 34px);
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
		gap: 12px;
	}
	.box {
		display: grid;
		place-items: center;
		width: 58px;
		height: 68px;
		border-radius: 18px;
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
	.dot {
		width: 14px;
		height: 14px;
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
		margin: 16px 0 8px;
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

	@media (max-width: 380px) {
		.box {
			width: 52px;
			height: 62px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.glass,
		.card {
			transition: opacity 250ms ease;
		}
		.opening .glass.left,
		.opening .glass.right {
			transform: none;
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
