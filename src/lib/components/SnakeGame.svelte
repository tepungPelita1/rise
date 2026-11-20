<script lang="ts">
	// Tiny snake mini-game for the lock screen. Arrow keys / WASD on desktop, swipe on phones.
	// Walls wrap around (easier for casual play); only biting yourself ends the run.
	import { onMount } from 'svelte';

	const COLS = 16;
	const ROWS = 16;
	const START_MS = 150;
	const MIN_MS = 70;
	const BEST_KEY = 'rise-snake-best';

	type P = { x: number; y: number };
	type Dir = 'up' | 'down' | 'left' | 'right';
	const VEC: Record<Dir, P> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
	const OPP: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

	let canvas: HTMLCanvasElement | undefined = $state();
	let wrap: HTMLDivElement | undefined = $state();

	let phase = $state<'ready' | 'playing' | 'paused' | 'over'>('ready');
	let score = $state(0);
	let best = $state(0);

	let snake: P[] = [];
	let dir: Dir = 'right';
	let queue: Dir[] = [];
	let food: P = { x: 0, y: 0 };
	let stepMs = START_MS;
	let acc = 0;
	let last = 0;
	let raf = 0;
	let pop = 0; // food bite flash

	function readBest() {
		try {
			best = Number(localStorage.getItem(BEST_KEY)) || 0;
		} catch {
			best = 0;
		}
	}
	function saveBest() {
		try {
			localStorage.setItem(BEST_KEY, String(best));
		} catch {
			/* private mode etc. — fine */
		}
	}

	function placeFood() {
		const free: P[] = [];
		for (let y = 0; y < ROWS; y++)
			for (let x = 0; x < COLS; x++) if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
		food = free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 };
	}

	function reset() {
		const cy = Math.floor(ROWS / 2);
		snake = [
			{ x: 5, y: cy },
			{ x: 4, y: cy },
			{ x: 3, y: cy }
		];
		dir = 'right';
		queue = [];
		stepMs = START_MS;
		acc = 0;
		score = 0;
		placeFood();
	}

	function start() {
		if (phase === 'playing') return;
		if (phase !== 'paused') reset();
		phase = 'playing';
		wrap?.focus({ preventScroll: true });
	}

	function turn(d: Dir) {
		if (phase === 'ready' || phase === 'over') {
			start();
		} else if (phase === 'paused') {
			phase = 'playing';
		}
		const lastDir = queue.length ? queue[queue.length - 1] : dir;
		if (d === lastDir || d === OPP[lastDir] || queue.length >= 2) return;
		queue.push(d);
	}

	function step() {
		if (queue.length) dir = queue.shift()!;
		const v = VEC[dir];
		const head = snake[0];
		const next = { x: (head.x + v.x + COLS) % COLS, y: (head.y + v.y + ROWS) % ROWS };
		const eating = next.x === food.x && next.y === food.y;
		// the tail moves away this tick unless we're growing, so it's safe to step onto
		const body = eating ? snake : snake.slice(0, -1);
		if (body.some((s) => s.x === next.x && s.y === next.y)) {
			phase = 'over';
			if (score > best) {
				best = score;
				saveBest();
			}
			navigator.vibrate?.(80);
			return;
		}
		snake.unshift(next);
		if (eating) {
			score += 1;
			pop = 1;
			stepMs = Math.max(MIN_MS, START_MS - score * 4);
			if (snake.length >= COLS * ROWS) {
				phase = 'over';
				return;
			}
			placeFood();
		} else {
			snake.pop();
		}
	}

	function css(name: string, fallback: string) {
		if (!canvas) return fallback;
		return getComputedStyle(canvas).getPropertyValue(name).trim() || fallback;
	}

	function draw() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const dpr = window.devicePixelRatio || 1;
		const size = canvas.clientWidth;
		if (canvas.width !== Math.round(size * dpr)) {
			canvas.width = Math.round(size * dpr);
			canvas.height = Math.round(size * dpr);
		}
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		const cell = size / COLS;

		const surface = css('--surface-2', '#f4f3f0');
		const dots = css('--dots', 'rgba(0,0,0,.1)');
		const ink = css('--ink', '#121212');
		const palette = ['--study', '--sky', '--life', '--self', '--lime', '--blob-4'].map((n) => css(n, '#cdbdf7'));

		ctx.fillStyle = surface;
		ctx.fillRect(0, 0, size, size);
		ctx.fillStyle = dots;
		for (let y = 0; y < ROWS; y++)
			for (let x = 0; x < COLS; x++) {
				ctx.beginPath();
				ctx.arc(x * cell + cell / 2, y * cell + cell / 2, 1.2, 0, Math.PI * 2);
				ctx.fill();
			}

		// food: a little pulsing star
		const t = performance.now() / 300;
		const r = cell * (0.42 + Math.sin(t) * 0.05);
		const fx = food.x * cell + cell / 2;
		const fy = food.y * cell + cell / 2;
		ctx.fillStyle = ink;
		ctx.beginPath();
		for (let i = 0; i < 10; i++) {
			const a = (Math.PI / 5) * i - Math.PI / 2 + t * 0.3;
			const rr = i % 2 ? r * 0.45 : r;
			ctx.lineTo(fx + Math.cos(a) * rr, fy + Math.sin(a) * rr);
		}
		ctx.closePath();
		ctx.fill();

		// snake: pastel candy segments with an ink outline
		const pad = cell * 0.08;
		ctx.lineWidth = Math.max(1.5, cell * 0.08);
		ctx.strokeStyle = ink;
		for (let i = snake.length - 1; i >= 0; i--) {
			const s = snake[i];
			const grow = i === 0 ? pop * cell * 0.12 : 0;
			ctx.fillStyle = palette[i % palette.length];
			ctx.beginPath();
			ctx.roundRect(s.x * cell + pad - grow, s.y * cell + pad - grow, cell - pad * 2 + grow * 2, cell - pad * 2 + grow * 2, cell * 0.3);
			ctx.fill();
			ctx.stroke();
		}

		// eyes on the head
		if (snake.length) {
			const h = snake[0];
			const v = VEC[dir];
			const cx = h.x * cell + cell / 2;
			const cy = h.y * cell + cell / 2;
			const side = { x: -v.y, y: v.x };
			ctx.fillStyle = ink;
			for (const k of [-1, 1]) {
				ctx.beginPath();
				ctx.arc(cx + v.x * cell * 0.15 + side.x * k * cell * 0.18, cy + v.y * cell * 0.15 + side.y * k * cell * 0.18, cell * 0.08, 0, Math.PI * 2);
				ctx.fill();
			}
		}
	}

	function loop(now: number) {
		const dt = Math.min(100, now - (last || now));
		last = now;
		if (phase === 'playing') {
			acc += dt;
			while (acc >= stepMs && phase === 'playing') {
				acc -= stepMs;
				step();
			}
		}
		pop = Math.max(0, pop - dt / 180);
		draw();
		raf = requestAnimationFrame(loop);
	}

	const KEYS: Record<string, Dir> = {
		ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
		w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right'
	};

	function onKey(e: KeyboardEvent) {
		// don't steal typing from other inputs (e.g. the PIN box)
		const el = e.target as HTMLElement | null;
		if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.closest('.snake') === null) return;
		const d = KEYS[e.key];
		if (d) {
			e.preventDefault();
			turn(d);
		} else if (e.key === ' ' || e.key === 'Enter') {
			if (el?.tagName === 'BUTTON') return;
			e.preventDefault();
			if (phase === 'playing') phase = 'paused';
			else start();
		}
	}

	// swipe: track from pointerdown, fire once the finger travels far enough, then re-anchor
	let sx = 0;
	let sy = 0;
	let tracking = false;
	function onDown(e: PointerEvent) {
		if (e.pointerType === 'mouse') return;
		tracking = true;
		sx = e.clientX;
		sy = e.clientY;
	}
	function onMove(e: PointerEvent) {
		if (!tracking) return;
		const dx = e.clientX - sx;
		const dy = e.clientY - sy;
		if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
		turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
		sx = e.clientX;
		sy = e.clientY;
	}
	function onUp() {
		tracking = false;
	}
	function onTap() {
		if (phase !== 'playing') start();
	}

	onMount(() => {
		readBest();
		reset();
		raf = requestAnimationFrame(loop);
		const onVis = () => {
			if (document.hidden && phase === 'playing') phase = 'paused';
		};
		document.addEventListener('visibilitychange', onVis);
		return () => {
			cancelAnimationFrame(raf);
			document.removeEventListener('visibilitychange', onVis);
		};
	});
</script>

<svelte:window onkeydown={onKey} />

<div class="snake">
	<div class="hud">
		<span class="pill score">🍬 {score}</span>
		<span class="title">ular<em>gula</em></span>
		<span class="pill best">best {best}</span>
	</div>

	<!-- keyboard is handled on window (svelte:window above) -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<div
		bind:this={wrap}
		class="board"
		tabindex="0"
		role="application"
		aria-label="Snake game. Use arrow keys or swipe to steer."
		onpointerdown={onDown}
		onpointermove={onMove}
		onpointerup={onUp}
		onpointercancel={onUp}
		onclick={onTap}
	>
		<canvas bind:this={canvas}></canvas>

		{#if phase !== 'playing'}
			<div class="overlay">
				{#if phase === 'over'}
					<p class="big">alamak! 💥</p>
					<p class="sub">score <strong>{score}</strong>{score > 0 && score >= best ? ' · new best!' : ''}</p>
				{:else if phase === 'paused'}
					<p class="big">paused</p>
				{:else}
					<p class="big">bosan? main jap 🐍</p>
				{/if}
				<span class="go">{phase === 'over' ? 'main lagi' : phase === 'paused' ? 'sambung' : 'tap / tekan arrow'}</span>
			</div>
		{/if}
	</div>

	<p class="help">
		<span class="desk">⬆️⬇️⬅️➡️ arrow key · space untuk pause</span>
		<span class="touch">swipe atas/bawah/kiri/kanan untuk gerak</span>
	</p>
</div>

<style>
	.snake {
		width: 100%;
	}
	.hud {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 10px;
	}
	.pill {
		padding: 4px 10px;
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 12px;
		border: 1.5px solid var(--ink);
	}
	.score {
		background: var(--life);
		color: var(--on-pastel);
	}
	.best {
		background: var(--sky);
		color: var(--on-pastel);
	}
	.title {
		font-family: var(--font-display);
		font-weight: 800;
		font-stretch: 80%;
		font-size: 22px;
		letter-spacing: -0.03em;
	}
	.title em {
		font-family: var(--font-serif);
		font-weight: 400;
		letter-spacing: 0;
	}
	.board {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		border-radius: 20px;
		overflow: hidden;
		border: 2px solid var(--ink);
		touch-action: none; /* swipes steer the snake, not the page */
		user-select: none;
		-webkit-user-select: none;
		cursor: pointer;
		outline: none;
	}
	.board:focus-visible {
		box-shadow: 0 0 0 3px var(--study);
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
	.overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 6px;
		background: color-mix(in srgb, var(--surface) 55%, transparent);
		backdrop-filter: blur(3px);
		-webkit-backdrop-filter: blur(3px);
	}
	.big {
		margin: 0;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 24px;
		letter-spacing: -0.02em;
	}
	.sub {
		margin: 0;
		font-size: 14px;
		color: var(--text-muted);
	}
	.go {
		margin-top: 6px;
		padding: 8px 16px;
		border-radius: 999px;
		background: var(--ink);
		color: var(--on-ink);
		font-family: var(--font-mono);
		font-size: 12px;
		letter-spacing: 0.06em;
	}
	.help {
		margin: 10px 0 0;
		font-size: 12px;
		color: var(--text-muted);
	}
	.touch {
		display: none;
	}
	@media (pointer: coarse) {
		.desk {
			display: none;
		}
		.touch {
			display: inline;
		}
	}
</style>
