import confetti from 'canvas-confetti';
import type { SubmitFunction } from '$app/forms';

const COLORS = ['#cdbdf7', '#3ddc84', '#ffe47a', '#f8c2e4', '#ddf5b3', '#cdeff5', '#121212'];

const calm = () =>
	typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Confetti burst from an element. */
export function burst(el: Element | null | undefined, big = false) {
	if (calm() || !el) return;
	const r = el.getBoundingClientRect();
	const origin = {
		x: (r.left + r.width / 2) / window.innerWidth,
		y: (r.top + r.height / 2) / window.innerHeight
	};
	confetti({
		particleCount: big ? 140 : 70,
		spread: big ? 100 : 70,
		startVelocity: big ? 45 : 32,
		scalar: 0.95,
		ticks: 180,
		origin,
		colors: COLORS,
		shapes: ['circle', 'square', 'star'],
		disableForReducedMotion: true
	});
}

/** use:enhance={celebrate} on a "done" form: confetti, then the normal update. */
export const celebrate: SubmitFunction = ({ submitter, formElement }) => {
	burst(submitter ?? formElement);
	return async ({ update }) => update();
};

/** Bigger burst, for the last of today's three. */
export const celebrateBig: SubmitFunction = ({ submitter, formElement }) => {
	burst(submitter ?? formElement, true);
	return async ({ update }) => update();
};
