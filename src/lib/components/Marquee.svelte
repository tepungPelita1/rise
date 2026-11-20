<script lang="ts">
	// Two crossing, endlessly scrolling bands. Hover pauses them.
	let { words = [] }: { words?: string[] } = $props();
	const BASE = ['pick three', 'one step at a time', 'lock in', 'tick it off', 'no zero days', 'small steps win'];
	let list = $derived([...words, ...BASE]);
	const SEP = ['✱', '✦', '●', '✿'];
</script>

<div class="bands" aria-hidden="true">
	<div class="band a">
		<div class="track">
			{#each [0, 1] as copy (copy)}
				<span class="run">
					{#each list as w, i (i)}
						<span class="w" class:serif={i % 3 === 1}>{w}</span><span class="sep s{i % 4}">{SEP[i % 4]}</span>
					{/each}
				</span>
			{/each}
		</div>
	</div>
	<div class="band b">
		<div class="track rev">
			{#each [0, 1] as copy (copy)}
				<span class="run">
					{#each [...list].reverse() as w, i (i)}
						<span class="w" class:serif={i % 3 === 2}>{w}</span><span class="sep s{(i + 2) % 4}">{SEP[i % 4]}</span>
					{/each}
				</span>
			{/each}
		</div>
	</div>
</div>

<style>
	.bands {
		position: relative;
		width: 100vw;
		margin: 48px 0 8px calc(50% - 50vw);
		height: 150px;
		overflow: hidden;
	}
	.band {
		position: absolute;
		left: -5vw;
		width: 110vw;
		padding: 12px 0;
		border-block: 3px solid #121212;
		overflow: hidden;
	}
	.band.a {
		top: 22px;
		background: #121212;
		color: var(--lime);
		transform: rotate(-3deg);
		z-index: 2;
	}
	.band.b {
		top: 52px;
		background: var(--life);
		color: #121212;
		transform: rotate(2.5deg);
	}
	.bands:hover .track {
		animation-play-state: paused;
	}
	.track {
		display: flex;
		width: max-content;
		animation: scroll 40s linear infinite;
	}
	.track.rev {
		animation-direction: reverse;
		animation-duration: 52s;
	}
	.run {
		display: flex;
		align-items: center;
		flex: none;
	}
	.w {
		padding: 0 18px;
		font-family: var(--font-display);
		font-weight: 800;
		font-stretch: 75%;
		font-size: 30px;
		line-height: 1.1;
		text-transform: uppercase;
		letter-spacing: -0.01em;
		white-space: nowrap;
	}
	.w.serif {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 400;
		text-transform: none;
		font-size: 34px;
	}
	.sep {
		display: inline-block;
		font-size: 26px;
		animation: spin 6s linear infinite;
	}
	.band.a .s0 { color: var(--self); }
	.band.a .s1 { color: var(--study); }
	.band.a .s2 { color: var(--build); }
	.band.a .s3 { color: var(--life); }
	.band.b .sep { color: #121212; }
	@media (max-width: 900px) {
		.bands {
			height: 110px;
			margin-top: 28px;
		}
		.band.b {
			top: 44px;
		}
		.w {
			font-size: 22px;
			padding: 0 12px;
		}
		.w.serif {
			font-size: 25px;
		}
	}
	@keyframes scroll {
		to { transform: translateX(-50%); }
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
