import { invalidateAll } from '$app/navigation';

/** One shared toast for the whole app. Optional "Undo" restores a dropped item. */
export const toast = $state({ msg: '', undoId: null as number | null, busy: false });

let timer: ReturnType<typeof setTimeout>;

export function notify(msg: string, undoId: number | null = null) {
	toast.msg = msg;
	toast.undoId = undoId;
	clearTimeout(timer);
	timer = setTimeout(() => {
		toast.msg = '';
		toast.undoId = null;
	}, undoId ? 6000 : 3500);
}

/** Called by the Undo button in the toast. */
export async function undoDrop() {
	if (!toast.undoId || toast.busy) return;
	toast.busy = true;
	const fd = new FormData();
	fd.append('id', String(toast.undoId));
	try {
		const r = await fetch('/bin?/restore', {
			method: 'POST',
			body: fd,
			headers: { accept: 'application/json', 'x-sveltekit-action': 'true' }
		});
		notify(r.ok ? 'Brought back ✱' : 'Could not undo — check the Bin');
		await invalidateAll();
	} finally {
		toast.busy = false;
	}
}

/** use:enhance callback for any "Drop" form: shows the Undo toast. */
export function dropWithUndo(title: string) {
	return ({ formData }: { formData: FormData }) => {
		const id = Number(formData.get('id'));
		return async ({ result, update }: { result: { type: string }; update: () => Promise<void> }) => {
			await update();
			if (result.type === 'success' || result.type === 'redirect') {
				notify(`Dropped “${title.length > 40 ? title.slice(0, 40) + '…' : title}”`, id);
			}
		};
	};
}
