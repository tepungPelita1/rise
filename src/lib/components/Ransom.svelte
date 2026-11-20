<script lang="ts">
	// "Ransom note" text: every word gets its own font, tilt and sticker.
	// Deterministic (hash of the word + position) so server and browser render the same.
	interface Props {
		text: string;
		size?: number;
	}
	let { text, size = 30 }: Props = $props();

	const STYLES = ['grot', 'serif', 'mono', 'outline', 'hi-pink', 'grot-wide', 'hi-lilac', 'serif', 'stamp'];

	function hash(s: string) {
		let h = 2166136261;
		for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
		return h >>> 0;
	}

	let words = $derived(
		text
			.trim()
			.split(/\s+/)
			.map((w, i) => {
				const h = hash(w + ':' + i);
				// never the same style twice in a row
				let style = STYLES[h % STYLES.length];
				return { w, style, tilt: ((h >> 8) % 9) - 4, lift: ((h >> 12) % 5) - 2, i };
			})
			.map((x, i, arr) => {
				if (i > 0 && arr[i - 1].style === x.style) x.style = STYLES[(STYLES.indexOf(x.style) + 2) % STYLES.length];
				return x;
			})
	);
</script>

<p class="ransom" style="--size: {size}px" aria-label={text}>
	{#each words as x (x.i)}
		<span
			class="w {x.style}"
			style="transform: rotate({x.tilt}deg) translateY({x.lift}px)"
			aria-hidden="true">{x.w}</span
		>{' '}
	{/each}
</p>

<style>
	.ransom {
		margin: 0;
		font-size: var(--size);
		line-height: 1.35;
		color: #121212;
	}
	.w {
		display: inline-block;
		margin: 0 0.04em;
		transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.ransom:hover .w {
		transform: rotate(0deg) translateY(0) !important;
	}
	.grot {
		font-family: var(--font-display);
		font-weight: 800;
		font-stretch: 75%;
		letter-spacing: -0.03em;
	}
	.grot-wide {
		font-family: var(--font-display);
		font-weight: 300;
		font-stretch: 100%;
		letter-spacing: -0.02em;
	}
	.serif {
		font-family: 'Instrument Serif', Georgia, serif;
		font-style: italic;
		font-size: 1.15em;
	}
	.mono {
		font-family: var(--font-mono);
		font-size: 0.62em;
		font-weight: 700;
		text-transform: uppercase;
		padding: 0.15em 0.45em;
		background: #121212;
		color: #fff;
		border-radius: 4px;
	}
	.stamp {
		font-family: var(--font-mono);
		font-size: 0.62em;
		font-weight: 700;
		text-transform: uppercase;
		padding: 0.1em 0.4em;
		border: 2px solid #121212;
		border-radius: 999px;
	}
	.outline {
		font-family: var(--font-display);
		font-weight: 800;
		font-stretch: 75%;
		color: transparent;
		-webkit-text-stroke: 1.5px #121212;
	}
	.hi-pink,
	.hi-lilac {
		font-family: var(--font-display);
		font-weight: 700;
		font-stretch: 85%;
		padding: 0 0.2em;
		border-radius: 0.3em;
	}
	.hi-pink {
		background: var(--self);
	}
	.hi-lilac {
		background: var(--study);
	}
</style>
