<script lang="ts">
	// Playful decorative shapes (from the Artistry / Illustratio references). Purely visual.
	interface Props {
		kind: 'flower' | 'asterisk' | 'loop' | 'star' | 'arc';
		class?: string;
	}
	let { kind, class: cls = '' }: Props = $props();
</script>

<svg class="deco {cls}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
	{#if kind === 'flower'}
		<g fill="currentColor">
			{#each [0, 60, 120, 180, 240, 300] as r (r)}
				<ellipse cx="60" cy="32" rx="20" ry="28" transform="rotate({r} 60 60)" />
			{/each}
			<circle cx="60" cy="60" r="22" />
		</g>
	{:else if kind === 'asterisk'}
		<g stroke="currentColor" stroke-width="20" stroke-linecap="round">
			<line x1="60" y1="12" x2="60" y2="108" />
			<line x1="18" y1="36" x2="102" y2="84" />
			<line x1="18" y1="84" x2="102" y2="36" />
		</g>
	{:else if kind === 'loop'}
		<path
			d="M10 110 C 20 40, 110 20, 100 70 C 92 105, 40 95, 55 55 C 68 22, 115 30, 118 10"
			fill="none"
			stroke="currentColor"
			stroke-width="14"
			stroke-linecap="round"
		/>
	{:else if kind === 'star'}
		<path
			fill="currentColor"
			d="M60 4 C 66 40, 80 54, 116 60 C 80 66, 66 80, 60 116 C 54 80, 40 66, 4 60 C 40 54, 54 40, 60 4 Z"
		/>
	{:else if kind === 'arc'}
		<g fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round">
			<path d="M15 110 A 45 45 0 0 1 105 110" />
			<path d="M32 110 A 28 28 0 0 1 88 110" />
			<path d="M49 110 A 11 11 0 0 1 71 110" />
		</g>
	{/if}
</svg>

<style>
	.deco {
		display: block;
		pointer-events: none;
	}
</style>
