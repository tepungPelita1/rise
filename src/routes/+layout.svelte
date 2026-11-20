<script lang="ts">
	import '../app.css';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import {
		Plus,
		Moon,
		SunMedium,
		Sun as SunIcon,
		Inbox,
		Target,
		Ellipsis,
		Clock,
		CircleCheck,
		ClipboardList,
		Quote,
		Trash2,
		X
	} from '@lucide/svelte';
	import { toast, notify, undoDrop } from '#lib/toast.svelte.ts';
	import LockSwitch from '#lib/components/LockSwitch.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const nav = [
		{ href: '/', label: 'Today' },
		{ href: '/inbox', label: 'Inbox' },
		{ href: '/later', label: 'Later' },
		{ href: '/goals', label: 'Goals' },
		{ href: '/done', label: 'Done' },
		{ href: '/review', label: 'Review' }
	];

	const onLock = $derived(page.url.pathname === '/unlock');
	const showSwitch = $derived(data.lockEnabled && data.unlocked && !onLock);

	let open = $state(false);
	let more = $state(false);

	// close the "More" sheet whenever the page changes
	$effect(() => {
		page.url.pathname;
		more = false;
	});

	const moreLinks = [
		{ href: '/later', label: 'Later', sub: 'everything waiting', icon: Clock },
		{ href: '/done', label: 'Done', sub: 'history + heatmap', icon: CircleCheck },
		{ href: '/review', label: 'Week Review', sub: '5 minutes, Sundays', icon: ClipboardList },
		{ href: '/quotes', label: 'Quotes', sub: 'hype yourself', icon: Quote },
		{ href: '/bin', label: 'Bin', sub: 'dropped stuff', icon: Trash2 }
	];
	let input: HTMLInputElement | undefined = $state();
	let theme = $state<'dark' | 'light'>('light');

	$effect(() => {
		theme = (document.documentElement.dataset.theme as 'dark' | 'light') ?? 'light';
	});

	$effect(() => {
		const msg = (page.form as { message?: string } | null)?.message;
		if (msg) notify(msg);
	});

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch {}
	}

	async function openCapture() {
		open = true;
		await tick();
		input?.focus();
	}

	// home-screen shortcut "Add task" opens /?add=1
	$effect(() => {
		if (page.url.searchParams.get('add') === '1') {
			openCapture();
			history.replaceState(history.state, '', page.url.pathname);
		}
	});

	function onKey(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			openCapture();
		} else if (e.key === 'Escape') {
			open = false;
			more = false;
		}
	}

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<svelte:window onkeydown={onKey} />
<svelte:head><title>{onLock ? 'Rise · Locked' : 'Rise'}</title></svelte:head>

<div class="blobs" aria-hidden="true">
	<span class="b1"></span><span class="b2"></span><span class="b3"></span><span class="b4"></span>
</div>

{#if onLock}
	{@render children()}
{:else}
<div class="frame">
	<header class="top">
		<a class="brand" href="/" aria-label="Rise home">
			<svg class="star" viewBox="0 0 24 24" aria-hidden="true">
				<path d="M12 1.5l2.6 6.6 7.1.5-5.4 4.6 1.7 6.9L12 16.3 6 20.1l1.7-6.9L2.3 8.6l7.1-.5z" />
			</svg>
			Rise
		</a>

		<nav aria-label="Main">
			{#each nav as item (item.href)}
				<a
					href={item.href}
					class:active={isActive(item.href)}
					aria-current={isActive(item.href) ? 'page' : undefined}
				>
					{item.label}
					{#if item.href === '/inbox' && data.inboxCount > 0}
						<span class="badge">{data.inboxCount}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<div class="right">
			{#if showSwitch}<LockSwitch />{/if}
			<button class="icon" onclick={toggleTheme} aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
				{#if theme === 'dark'}<SunMedium size={18} />{:else}<Moon size={18} />{/if}
			</button>
			<button class="btn primary" onclick={openCapture}>
				<Plus size={16} aria-hidden="true" /> Add task <kbd>Ctrl K</kbd>
			</button>
		</div>
	</header>

	<main>
		{@render children()}
	</main>
</div>

<!-- phone: bottom tab bar -->
<nav class="tabbar" aria-label="Main (mobile)">
	<a href="/" class:active={isActive('/')} aria-current={isActive('/') ? 'page' : undefined}>
		<SunIcon size={22} aria-hidden="true" /><span>Today</span>
	</a>
	<a href="/inbox" class:active={isActive('/inbox')} aria-current={isActive('/inbox') ? 'page' : undefined}>
		<span class="ico">
			<Inbox size={22} aria-hidden="true" />
			{#if data.inboxCount > 0}<span class="dotcount">{data.inboxCount}</span>{/if}
		</span>
		<span>Inbox</span>
	</a>
	<button class="fab" onclick={openCapture} aria-label="Add task"><Plus size={28} strokeWidth={2.6} /></button>
	<a href="/goals" class:active={isActive('/goals')} aria-current={isActive('/goals') ? 'page' : undefined}>
		<Target size={22} aria-hidden="true" /><span>Goals</span>
	</a>
	<button
		class:active={more || moreLinks.some((l) => isActive(l.href))}
		onclick={() => (more = !more)}
		aria-expanded={more}
		aria-controls="more-sheet"
	>
		<Ellipsis size={22} aria-hidden="true" /><span>More</span>
	</button>
</nav>

{#if more}
	<div class="overlay" role="presentation" onclick={() => (more = false)}></div>
	<div class="sheet" id="more-sheet" role="dialog" aria-modal="true" aria-label="More pages">
		<div class="grab" aria-hidden="true"></div>
		<div class="sheet-head">
			<h2>More <em>stuff.</em></h2>
			<button class="icon" onclick={() => (more = false)} aria-label="Close"><X size={18} /></button>
		</div>
		<div class="sheet-grid">
			{#each moreLinks as l, i (l.href)}
				<a href={l.href} class="tile t{i}" class:active={isActive(l.href)}>
					<l.icon size={22} aria-hidden="true" />
					<strong>{l.label}</strong>
					<span>{l.sub}</span>
				</a>
			{/each}
		</div>
		{#if showSwitch}<div class="lock-row"><LockSwitch /></div>{/if}
		<button class="btn theme-row" onclick={toggleTheme}>
			{#if theme === 'dark'}<SunMedium size={16} aria-hidden="true" /> Light mode{:else}<Moon size={16} aria-hidden="true" /> Dark mode{/if}
		</button>
	</div>
{/if}

{#if open}
	<div class="overlay" role="presentation" onclick={() => (open = false)}></div>
	<div class="capture" role="dialog" aria-modal="true" aria-labelledby="capture-title">
		<h2 id="capture-title">Write it down, <em>sort it later.</em></h2>
		<form
			method="POST"
			action="/inbox?/add"
			use:enhance={() =>
				async ({ result }) => {
					if (result.type === 'success') {
						open = false;
						notify('Added to Inbox');
						await invalidateAll();
					}
				}}
		>
			<label class="sr-only" for="capture-input">Task</label>
			<input
				id="capture-input"
				class="input"
				name="title"
				placeholder="e.g. Beli protein"
				autocomplete="off"
				required
				bind:this={input}
			/>
			<div class="row">
				<span class="hint">Enter to save · Esc to close</span>
				<button class="btn primary">Save to Inbox</button>
			</div>
		</form>
	</div>
{/if}

{/if}

{#if toast.msg}
	<div class="toast" role="status">
		<span>{toast.msg}</span>
		{#if toast.undoId}
			<button class="undo" onclick={undoDrop} disabled={toast.busy}>Undo</button>
		{/if}
	</div>
{/if}

<style>
	/* drifting pastel blobs behind everything */
	.blobs {
		position: fixed;
		inset: 0;
		z-index: -1;
		overflow: hidden;
		pointer-events: none;
		opacity: var(--blob-opacity);
	}
	.blobs span {
		position: absolute;
		width: 46vmax;
		height: 46vmax;
		border-radius: 50%;
		filter: blur(80px);
		animation: drift 26s ease-in-out infinite alternate;
	}
	.b1 { background: var(--blob-1); top: -18vmax; left: -12vmax; }
	.b2 { background: var(--blob-2); top: 10vmax; right: -16vmax; animation-duration: 32s !important; animation-delay: -8s !important; }
	.b3 { background: var(--blob-3); bottom: -20vmax; left: 20vmax; animation-duration: 38s !important; animation-delay: -15s !important; }
	.b4 { background: var(--blob-4); bottom: 0; right: 10vmax; width: 30vmax !important; height: 30vmax !important; animation-duration: 22s !important; }
	@keyframes drift {
		0% { transform: translate(0, 0) scale(1); }
		50% { transform: translate(8vmax, 6vmax) scale(1.15); }
		100% { transform: translate(-6vmax, 10vmax) scale(0.9); }
	}
	:global(:root[data-theme='dark']) .blobs span {
		mix-blend-mode: screen;
	}
	.star {
		animation: slowspin 14s linear infinite;
	}
	@keyframes slowspin {
		to { transform: rotate(360deg); }
	}

	.frame {
		max-width: 1180px;
		margin: 0 auto;
		padding: 20px 24px 80px;
	}
	.top {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 16px;
		padding: 10px 10px 10px 20px;
		border-radius: 999px;
		background: var(--surface);
		border: 1px solid var(--border);
		position: sticky;
		top: 12px;
		z-index: 5;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-display);
		font-weight: 800;
		font-stretch: 75%;
		font-size: 24px;
		letter-spacing: -0.03em;
		text-decoration: none;
	}
	.star {
		width: 24px;
		height: 24px;
		fill: var(--ink);
		transition: transform 400ms ease;
	}
	.brand:hover .star {
		transform: rotate(72deg);
	}
	nav {
		display: flex;
		gap: 4px;
	}
	nav a {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 38px;
		padding: 0 16px;
		border-radius: 999px;
		border: 1.5px solid var(--border);
		font-size: 14px;
		font-weight: 500;
		text-decoration: none;
		transition:
			background 180ms ease,
			border-color 180ms ease,
			color 180ms ease;
	}
	nav a:hover {
		border-color: var(--ink);
	}
	nav a.active {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--on-ink);
	}
	.badge {
		min-width: 20px;
		padding: 0 6px;
		border-radius: 999px;
		background: var(--self);
		color: var(--on-pastel);
		font-size: 11px;
		font-weight: 700;
		text-align: center;
		line-height: 18px;
	}
	.right {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 8px;
	}
	.icon {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 1px solid var(--border);
		background: var(--surface);
		cursor: pointer;
		transition: border-color 180ms ease;
	}
	.icon:hover {
		border-color: var(--ink);
	}
	kbd {
		font-family: var(--font-mono);
		font-size: 11px;
		opacity: 0.6;
		margin-left: 4px;
	}
	main {
		padding-top: 36px;
	}

	.overlay {
		position: fixed;
		inset: 0;
		background: rgb(18 18 18 / 0.35);
		backdrop-filter: blur(3px);
		z-index: 10;
	}
	.capture {
		position: fixed;
		top: 18vh;
		left: 50%;
		transform: translateX(-50%);
		width: min(560px, calc(100vw - 32px));
		padding: 28px;
		border-radius: 28px;
		background: var(--lime);
		color: var(--on-pastel);
		z-index: 11;
		box-shadow: var(--shadow-lift);
	}
	.capture h2 {
		font-size: 28px;
		font-weight: 600;
		margin-bottom: 18px;
	}
	.capture .input {
		width: 100%;
		font-size: 17px;
		background: #fff;
		color: #121212;
		border-color: transparent;
	}
	.capture .btn.primary {
		background: #121212;
		border-color: #121212;
		color: #fff;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 14px;
	}
	.hint {
		font-size: 12px;
		opacity: 0.7;
	}
	.toast {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		padding: 10px 18px;
		border-radius: 999px;
		background: var(--ink);
		color: var(--on-ink);
		font-size: 14px;
		font-weight: 500;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 12px;
		max-width: calc(100vw - 32px);
	}
	.toast span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.undo {
		flex: none;
		min-height: 30px;
		padding: 0 14px;
		border: 0;
		border-radius: 999px;
		background: var(--lime);
		color: #121212;
		font-weight: 700;
		cursor: pointer;
	}

	/* ---------- phone tab bar + More sheet ---------- */
	.tabbar {
		display: none;
	}
	.sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 11;
		padding: 10px 18px calc(22px + env(safe-area-inset-bottom));
		border-radius: 28px 28px 0 0;
		background: var(--surface);
		border-top: 3px solid var(--ink);
		animation: sheet-up 260ms cubic-bezier(0.2, 0.9, 0.3, 1.1);
	}
	@keyframes sheet-up {
		from { transform: translateY(100%); }
	}
	.grab {
		width: 44px;
		height: 5px;
		margin: 0 auto 12px;
		border-radius: 999px;
		background: var(--border);
	}
	.sheet-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 14px;
	}
	.sheet-head h2 {
		font-size: 30px;
	}
	.sheet-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
	.tile {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-height: 104px;
		padding: 14px;
		border-radius: 20px;
		border: 2.5px solid #121212;
		color: #121212;
		text-decoration: none;
		box-shadow: 4px 4px 0 #121212;
		transition: transform 120ms ease, box-shadow 120ms ease;
	}
	.tile:active {
		transform: translate(3px, 3px);
		box-shadow: 1px 1px 0 #121212;
	}
	.tile strong {
		margin-top: auto;
		font-family: var(--font-display);
		font-stretch: 80%;
		font-size: 19px;
	}
	.tile span {
		font-family: var(--font-mono);
		font-size: 10.5px;
	}
	.t0 { background: var(--sky); }
	.t1 { background: var(--build); }
	.t2 { background: var(--study); }
	.t3 { background: var(--self); }
	.t4 { background: var(--life); }
	.tile.active {
		outline: 3px solid var(--ink);
		outline-offset: 3px;
	}
	.lock-row {
		display: flex;
		justify-content: center;
		margin-top: 14px;
	}
	.theme-row {
		width: 100%;
		margin-top: 14px;
		min-height: 48px;
	}

	@media (max-width: 900px) {
		.top {
			grid-template-columns: 1fr auto;
			top: calc(8px + env(safe-area-inset-top));
			padding: 8px 8px 8px 16px;
		}
		.top nav,
		.right .btn,
		kbd,
		.hint {
			display: none;
		}
		.frame {
			padding: 12px 16px calc(110px + env(safe-area-inset-bottom));
		}
		main {
			padding-top: 24px;
		}
		.tabbar {
			position: fixed;
			left: 12px;
			right: 12px;
			bottom: calc(10px + env(safe-area-inset-bottom));
			z-index: 9;
			display: grid;
			grid-template-columns: repeat(5, 1fr);
			align-items: center;
			height: 68px;
			padding: 0 6px;
			border-radius: 26px;
			background: var(--surface);
			border: 2.5px solid var(--ink);
			box-shadow: 0 6px 0 var(--ink);
		}
		.tabbar a,
		.tabbar > button:not(.fab) {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 2px;
			height: 56px;
			border: 0;
			border-radius: 18px;
			background: none;
			color: var(--text-muted);
			font-family: var(--font-mono);
			font-size: 10px;
			text-decoration: none;
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
		}
		.tabbar a.active,
		.tabbar > button.active {
			color: #121212;
			background: var(--lime);
		}
		.ico {
			position: relative;
			display: grid;
		}
		.dotcount {
			position: absolute;
			top: -6px;
			right: -10px;
			min-width: 17px;
			padding: 0 4px;
			border-radius: 999px;
			background: var(--self);
			color: #121212;
			border: 1.5px solid #121212;
			font-size: 10px;
			font-weight: 700;
			line-height: 14px;
			text-align: center;
		}
		.fab {
			justify-self: center;
			display: grid;
			place-items: center;
			width: 62px;
			height: 62px;
			margin-top: -30px;
			border-radius: 50%;
			border: 3px solid #121212;
			background: var(--lime);
			color: #121212;
			box-shadow: 0 5px 0 #121212;
			cursor: pointer;
			transition: transform 120ms ease, box-shadow 120ms ease;
			-webkit-tap-highlight-color: transparent;
		}
		.fab:active {
			transform: translateY(4px) rotate(90deg);
			box-shadow: 0 1px 0 #121212;
		}
		.toast {
			bottom: calc(96px + env(safe-area-inset-bottom));
		}
		.capture {
			top: calc(14px + env(safe-area-inset-top));
			padding: 22px;
		}
		.capture h2 {
			font-size: 24px;
		}
	}
</style>
