/**
 * PIN lock core: PIN hashing, signed unlock cookies and the wrong-PIN lockout.
 * Pure (no SvelteKit imports) so it can be tested with `node --test` and used by scripts.
 *
 * Env (server only, never in git):
 *   RISE_PIN_HASH  scrypt$<saltHex>$<hashHex>   (make with: node scripts/set-pin.mjs)
 *   RISE_SECRET    >= 32 hex chars, signs the unlock cookie. Changing it locks every device.
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const COOKIE = 'rise_unlock';
/** browsers cap cookie lifetime at 400 days */
export const REMEMBER_SECONDS = 400 * 24 * 60 * 60;

const KEYLEN = 32;

export const PIN_LENGTH = 6;

export function isValidPinFormat(pin: string): boolean {
	return pin.length === PIN_LENGTH && /^\d+$/.test(pin);
}

export function hashPin(pin: string): string {
	const salt = randomBytes(16);
	const hash = scryptSync(pin, salt, KEYLEN);
	return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPin(pin: string, stored: string): boolean {
	const [kind, saltHex, hashHex] = stored.split('$');
	if (kind !== 'scrypt' || !saltHex || !hashHex) return false;
	const expected = Buffer.from(hashHex, 'hex');
	if (expected.length !== KEYLEN) return false;
	const actual = scryptSync(pin, Buffer.from(saltHex, 'hex'), KEYLEN);
	return timingSafeEqual(actual, expected);
}

function sign(secret: string, payload: string) {
	return createHmac('sha256', secret).update(payload).digest('hex');
}

export function makeToken(secret: string, now = Date.now()): string {
	const payload = `v1.${now}`;
	return `${payload}.${sign(secret, payload)}`;
}

export function checkToken(token: string | undefined, secret: string): boolean {
	if (!token) return false;
	const parts = token.split('.');
	if (parts.length !== 3 || parts[0] !== 'v1' || !/^\d+$/.test(parts[1])) return false;
	const expected = Buffer.from(sign(secret, `${parts[0]}.${parts[1]}`), 'hex');
	const given = Buffer.from(parts[2], 'hex');
	return given.length === expected.length && timingSafeEqual(given, expected);
}

const MIN = 60_000;
/** lock length after each round of 3 misses; the last one repeats */
const STEPS = [15 * MIN, 60 * MIN, 24 * 60 * MIN];
const MISSES_PER_ROUND = 3;

export function createLimiter() {
	let misses = 0;
	let round = 0;
	let lockedUntil = 0;
	return {
		status(now: number) {
			return { locked: now < lockedUntil, retryAt: lockedUntil };
		},
		fail(now: number) {
			misses += 1;
			if (misses >= MISSES_PER_ROUND) {
				lockedUntil = now + STEPS[Math.min(round, STEPS.length - 1)];
				round += 1;
				misses = 0;
			}
		},
		reset() {
			misses = 0;
			round = 0;
			lockedUntil = 0;
		}
	};
}

export type LockConfig = { enabled: boolean; configured: boolean; hash?: string; secret?: string };

export function lockConfig(env: Record<string, string | undefined>, isDev: boolean): LockConfig {
	const hash = env.RISE_PIN_HASH?.trim();
	const secret = env.RISE_SECRET?.trim();
	if (hash && secret && secret.length >= 32) return { enabled: true, configured: true, hash, secret };
	// dev without a PIN: no lock. Production without a PIN: fail closed.
	return isDev ? { enabled: false, configured: false } : { enabled: true, configured: false };
}
