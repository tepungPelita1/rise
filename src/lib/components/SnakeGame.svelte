<script lang="ts">
	// Full-screen snake for the lock screen. The whole viewport is the board, except the
	// "island" (the PIN card in the middle) — bump into it and the run ends.
	// Arrow keys / WASD on desktop, swipe on phones. Screen edges wrap around.
	import { onMount } from 'svelte';

	let { island }: { island?: HTMLElement } = $props();

	const CELL = 26; // px per grid cell
	const START_MS = 120;
	const MIN_MS = 55;
	const BEST_KEY = 'rise-snake-best';

	type P = { x: number; y: number };
	type Dir = 'up' | 'down' | 'left' | 'right';
	const VEC: Record<Dir, P> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
	const OPP: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

	let canvas: HTMLCanvasElement | undefined = $state();

	let phase = $state<'playing' | 'paused' | 'over'>('playing');
	let score = $state(0);
	let best = $state(0);

	let cols = 0;
	let rows = 0;
	let offX = 0; // centers the grid in the viewport
	let offY = 0;
	let blocked = new Set<number>();
	let snake: P[] = [];
	let dir: Dir = 'right';
	let queue: Dir[] = [];
	let food: P = { x: 0, y: 0 };
	let stepMs = START_MS;
	let acc = 0;
	let last = 0;
	let raf = 0;
	let pop = 0;

	const key = (x: number, y: number) => y * cols + x;
	const isBlocked = (x: number, y: number) => blocked.has(key(x, y));

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

	/** grid size from the viewport + which cells the island covers (with a little margin) */
	function layout() {
		const w = window.innerWidth;
		const h = window.innerHeight;
		cols = Math.max(8, Math.floor(w / CELL));
		rows = Math.max(8, Math.floor(h / CELL));
		offX = (w - cols * CELL) / 2;
		offY = (h - rows * CELL) / 2;
		blocked = new Set();
		const r = island?.getBoundingClientRect();
		if (!r) return;
		const m = 6;
		const x0 = Math.max(0, Math.floor((r.left - m - offX) / CELL));
		const x1 = Math.min(cols - 1, Math.floor((r.right + m - offX) / CELL));
		const y0 = Math.max(0, Math.floor((r.top - m - offY) / CELL));
		const y1 = Math.min(rows - 1, Math.floor((r.bottom + m - offY) / CELL));
		for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) blocked.add(key(x, y));
	}

	function placeFood() {
		const taken = new Set(snake.map((s) => key(s.x, s.y)));
		const free: P[] = [];
		for (let y = 0; y < rows; y++)
			for (let x = 0; x < cols; x++) if (!blocked.has(key(x, y)) && !taken.has(key(x, y))) free.push({ x, y });
		food = free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 };
	}

	function reset() {
		layout();
		// start in the first free row from the top
		let y = 1;
		while (y < rows - 1 && [1, 2, 3, 4].some((x) => isBlocked(x, y))) y++;
		snake = [
			{ x: 4, y },
			{ x: 3, y },
			{ x: 2, y }
		];
		dir = 'right';
		queue = [];
		stepMs = START_MS;
		acc = 0;
		score = 0;
		placeFood();
	}

	function restart() {
		reset();
		phase = 'playing';
	}

	function turn(d: Dir) {
		if (phase === 'over') return restart();
		if (phase === 'paused') phase = 'playing';
		const lastDir = queue.length ? queue[queue.length - 1] : dir;
		if (d === lastDir || d === OPP[lastDir] || queue.length >= 2) return;
		queue.push(d);
	}

	function die() {
		phase = 'over';
		if (score > best) {
			best = score;
			saveBest();
		}
		navigator.vibrate?.(80);
	}

	function step() {
		if (queue.length) dir = queue.shift()!;
		const v = VEC[dir];
		const head = snake[0];
		const next = { x: (head.x + v.x + cols) % cols, y: (head.y + v.y + rows) % rows };
		if (isBlocked(next.x, next.y)) return die();
		const eating = next.x === food.x && next.y === food.y;
		const body = eating ? snake : snake.slice(0, -1);
		if (body.some((s) => s.x === next.x && s.y === next.y)) return die();
		snake.unshift(next);
		if (eating) {
			score += 1;
			pop = 1;
			stepMs = Math.max(MIN_MS, START_MS - score * 3);
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
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(h * dpr);
		}
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);
		ctx.translate(offX, offY);

		const ink = css('--ink', '#121212');
		const onInk = css('--on-ink', '#ffffff');
		const c = CELL;

		// food: a pulsing black star
		const t = performance.now() / 300;
		const r = c * (0.42 + Math.sin(t) * 0.06);
		const fx = food.x * c + c / 2;
		const fy = food.y * c + c / 2;
		ctx.fillStyle = ink;
		ctx.beginPath();
		for (let i = 0; i < 10; i++) {
			const a = (Math.PI / 5) * i - Math.PI / 2 + t * 0.3;
			const rr = i % 2 ? r * 0.45 : r;
			ctx.lineTo(fx + Math.cos(a) * rr, fy + Math.sin(a) * rr);
		}
		ctx.closePath();
		ctx.fill();

		// snake: one solid black body, segments joined into a chunky rounded line
		if (snake.length) {
			ctx.strokeStyle = ink;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.lineWidth = c * 0.72;
			ctx.beginPath();
			for (let i = 0; i < snake.length; i++) {
				const s = snake[i];
				const px = s.x * c + c / 2;
				const py = s.y * c + c / 2;
				const prev = snake[i - 1];
				// break the line where the body wraps across a screen edge
				if (i === 0 || Math.abs(prev.x - s.x) + Math.abs(prev.y - s.y) > 1) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			if (snake.length === 1) ctx.lineTo(snake[0].x * c + c / 2 + 0.1, snake[0].y * c + c / 2);
			ctx.stroke();

			// head
			const h0 = snake[0];
			const cx = h0.x * c + c / 2;
			const cy = h0.y * c + c / 2;
			ctx.fillStyle = ink;
			ctx.beginPath();
			ctx.arc(cx, cy, c * (0.44 + pop * 0.12), 0, Math.PI * 2);
			ctx.fill();

			// eyes
			const v = VEC[dir];
			const side = { x: -v.y, y: v.x };
			ctx.fillStyle = onInk;
			for (const k of [-1, 1]) {
				ctx.beginPath();
				ctx.arc(cx + v.x * c * 0.14 + side.x * k * c * 0.17, cy + v.y * c * 0.14 + side.y * k * c * 0.17, c * 0.09, 0, Math.PI * 2);
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
		const el = e.target as HTMLElement | null;
		const inField = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
		const d = KEYS[e.key];
		// arrows always steer (the PIN box is digits only); letters stay with the PIN box
		if (d && (!inField || e.key.startsWith('Arrow'))) {
			e.preventDefault();
			turn(d);
		} else if (e.key === ' ' && !inField && el?.tagName !== 'BUTTON') {
			e.preventDefault();
			if (phase === 'playing') phase = 'paused';
			else if (phase === 'paused') phase = 'playing';
			else restart();
		}
	}

	// swipe anywhere outside the card: fire once the finger travels far enough, then re-anchor
	let sx = 0;
	let sy = 0;
	let tracking = false;
	function onDown(e: PointerEvent) {
		if (e.pointerType === 'mouse') {
			if (phase === 'over') restart();
			else if (phase === 'paused') phase = 'playing';
			return;
		}
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
		if (tracking && phase === 'over') restart();
		tracking = false;
	}

	onMount(() => {
		readBest();
		reset();
		raf = requestAnimationFrame(loop);
		const onVis = () => {
			if (document.hidden && phase === 'playing') phase = 'paused';
		};
		// screen size changed: the grid changes too, so start a fresh run
		const onResize = () => {
			if (phase === 'playing') phase = 'paused';
			reset();
		};
		document.addEventListener('visibilitychange', onVis);
		window.addEventListener('resize', onResize);
		return () => {
			cancelAnimationFrame(raf);
			document.removeEventListener('visibilitychange', onVis);
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<svelte:window onkeydown={onKey} />

<canvas
	bind:this={canvas}
	class="field"
	aria-label="Snake game. Arrow keys or swipe to steer. Don't hit the card in the middle."
	onpointerdown={onDown}
	onpointermove={onMove}
	onpointerup={onUp}
	onpointercancel={onUp}
></canvas>

<div class="hud" aria-live="polite">
	<span class="pill">🍬 {score}</span>
	<span class="state">
		{#if phase === 'over'}
			alamak! 💥 <em>tap / arrow untuk main lagi</em>
		{:else if phase === 'paused'}
			paused · <em>space untuk sambung</em>
		{:else}
			<span class="desk">arrow / WASD · jangan langgar kotak</span>
			<span class="touch">swipe · jangan langgar kotak</span>
		{/if}
	</span>
	<span class="pill">best {best}</span>
</div>

<style>
	.field {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100dvh;
		display: block;
		touch-action: none; /* swipes steer the snake, not the page */
		cursor: crosshair;
		animation: fade-in 300ms ease;
	}
	.hud {
		position: fixed;
		top: 16px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 8px;
		border-radius: 999px;
		background: var(--ink);
		color: var(--on-ink);
		font-family: var(--font-mono);
		font-size: 12px;
		white-space: nowrap;
		box-shadow: var(--shadow-lift);
		z-index: 2;
		pointer-events: none;
		animation: drop-in 380ms cubic-bezier(0.3, 1.4, 0.5, 1);
	}
	.pill {
		padding: 3px 10px;
		border-radius: 999px;
		background: var(--on-ink);
		color: var(--ink);
	}
	.state em {
		font-family: var(--font-serif);
		font-size: 15px;
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
	@keyframes fade-in {
		from { opacity: 0; }
	}
	@keyframes drop-in {
		from { transform: translate(-50%, -40px); opacity: 0; }
	}
</style>
