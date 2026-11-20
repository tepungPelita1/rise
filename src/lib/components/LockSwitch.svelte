<script lang="ts">
	import { enhance } from '$app/forms';
	import { LockOpen } from '@lucide/svelte';

	let { compact = false }: { compact?: boolean } = $props();

	let closing = $state(false);
	let form: HTMLFormElement | undefined = $state();

	function lock() {
		if (closing) return;
		closing = true;
		// the service worker keeps copies of pages for offline use: drop them so a locked
		// device can't show old task data while offline
		try {
			caches?.delete('rise-pages');
		} catch {}
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		setTimeout(() => form?.requestSubmit(), reduced ? 150 : 450);
	}
</script>

<form bind:this={form} method="POST" action="/unlock?/lock" use:enhance class="wrap">
	<button
		type="button"
		role="switch"
		aria-checked={!closing}
		aria-label="Lock Rise on this device"
		title="Lock Rise on this device"
		class="switch"
		class:compact
		class:off={closing}
		onclick={lock}
	>
		<span class="track">
			<span class="knob"><LockOpen size={13} strokeWidth={2.6} aria-hidden="true" /></span>
		</span>
		{#if !compact}<span class="label">{closing ? 'Locking…' : 'Unlocked'}</span>{/if}
	</button>
</form>

{#if closing}
	<div class="curtain" aria-hidden="true">
		<span class="half l"></span><span class="half r"></span>
	</div>
{/if}

<style>
	.wrap {
		display: contents;
	}
	.switch {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 40px;
		padding: 0 12px 0 6px;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--surface);
		font: inherit;
		font-size: 13px;
		font-weight: 600;
		color: var(--text);
		cursor: pointer;
		transition: border-color 180ms ease;
	}
	.switch:hover {
		border-color: var(--ink);
	}
	.switch.compact {
		padding: 0 6px;
	}
	.track {
		position: relative;
		width: 46px;
		height: 28px;
		border-radius: 999px;
		background: var(--build);
		transition: background 250ms ease;
	}
	.knob {
		position: absolute;
		top: 3px;
		left: 21px;
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--surface);
		color: var(--text);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.25);
		transition: left 250ms cubic-bezier(0.5, 0, 0.2, 1.4);
	}
	.off .track {
		background: var(--border);
	}
	.off .knob {
		left: 3px;
	}

	/* reverse of the unlock: two glass halves slide shut */
	.curtain {
		position: fixed;
		inset: 0;
		z-index: 100;
		pointer-events: none;
	}
	.half {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 50.5%;
		background: color-mix(in srgb, var(--bg) 45%, transparent);
		backdrop-filter: blur(28px) saturate(1.3);
		-webkit-backdrop-filter: blur(28px) saturate(1.3);
		animation: shut 450ms cubic-bezier(0.7, 0, 0.2, 1) forwards;
	}
	.half.l {
		left: 0;
		--from: -101%;
	}
	.half.r {
		right: 0;
		--from: 101%;
	}
	@keyframes shut {
		from { transform: translateX(var(--from)); }
		to { transform: translateX(0); }
	}
	@media (prefers-reduced-motion: reduce) {
		.half {
			animation: fade 150ms ease forwards;
		}
		@keyframes fade {
			from { opacity: 0; }
		}
	}
</style>
