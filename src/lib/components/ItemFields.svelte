<script lang="ts">
	import { AREAS, AREA_LABEL, REPEAT_LABEL, type Item, type ItemType } from '#lib/types.ts';

	interface Props {
		item: Item;
		goals: { id: number; title: string }[];
		showNotes?: boolean;
		askFirstStep?: boolean;
	}

	let { item, goals, showNotes = true, askFirstStep = false }: Props = $props();

	// svelte-ignore state_referenced_locally
	let type = $state<ItemType>(item.type);
	const uid = `f${item.id}`;
</script>

<div class="grid">
	<label class="field wide">
		Title
		<input name="title" value={item.title} required maxlength="300" />
	</label>

	<label class="field">
		Area
		<select name="area" required>
			<option value="" disabled selected={!item.area}>Choose…</option>
			{#each AREAS as a (a)}
				<option value={a} selected={item.area === a}>{AREA_LABEL[a]}</option>
			{/each}
		</select>
	</label>

	<fieldset class="field">
		<legend>Kind</legend>
		<div class="seg">
			{#each [['task', 'Task'], ['goal', 'Goal'], ['habit', 'Habit']] as [v, label] (v)}
				<label class:on={type === v}>
					<input type="radio" name="type" value={v} bind:group={type} />
					{label}
				</label>
			{/each}
		</div>
	</fieldset>

	{#if type === 'task'}
		<label class="field">
			Due date <span class="help">real deadline</span>
			<input type="date" name="due" value={item.due ?? ''} />
		</label>
		<label class="field">
			Plan date <span class="help">when you will do it</span>
			<input type="date" name="do_date" value={item.do_date ?? ''} />
		</label>
		<label class="field">
			Repeat
			<select name="repeat">
				{#each Object.entries(REPEAT_LABEL) as [v, label] (v)}
					<option value={v} selected={item.repeat === v}>{label}</option>
				{/each}
			</select>
		</label>
		<label class="field">
			Part of goal
			<select name="goal_id">
				<option value="">None</option>
				{#each goals.filter((g) => g.id !== item.id) as g (g.id)}
					<option value={g.id} selected={item.goal_id === g.id}>{g.title}</option>
				{/each}
			</select>
		</label>
	{:else if type === 'goal' && askFirstStep}
		<label class="field wide">
			First small step <span class="help">something you can do in under 1 hour</span>
			<input name="first_step" id="{uid}-step" placeholder="e.g. Watch one tutorial (30 min)" required />
		</label>
	{:else if type === 'habit'}
		<p class="wide help">A habit repeats every day. Tick it on the Today screen.</p>
	{/if}

	{#if showNotes}
		<label class="field wide">
			Notes
			<textarea name="notes">{item.notes}</textarea>
		</label>
	{/if}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 14px 16px;
	}
	.wide {
		grid-column: 1 / -1;
	}
	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
	}
	legend {
		padding: 0;
		margin-bottom: 6px;
	}
	.help {
		font-weight: 400;
		font-size: 12px;
		color: var(--text-muted);
		margin: 0;
	}
	.seg {
		display: flex;
		padding: 3px;
		gap: 3px;
		min-height: 40px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg);
	}
	.seg label {
		flex: 1;
		display: grid;
		place-items: center;
		border-radius: 6px;
		cursor: pointer;
		color: var(--text-muted);
		font-size: 14px;
	}
	.seg label.on {
		background: var(--lime);
		color: var(--ink);
		font-weight: 600;
	}
	.seg input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.seg label:has(input:focus-visible) {
		outline: 2px solid var(--ink);
	}
	@media (max-width: 560px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
