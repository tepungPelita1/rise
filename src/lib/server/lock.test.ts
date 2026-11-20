import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	hashPin,
	verifyPin,
	isValidPinFormat,
	makeToken,
	checkToken,
	createLimiter,
	lockConfig
} from './lock.ts';

const MIN = 60_000;

test('hash + verify', () => {
	const h = hashPin('4821');
	assert.match(h, /^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);
	assert.equal(verifyPin('4821', h), true);
	assert.equal(verifyPin('4822', h), false);
	assert.equal(verifyPin('4821', 'garbage'), false);
});

test('pin format', () => {
	assert.equal(isValidPinFormat('1234'), true);
	assert.equal(isValidPinFormat('12a4'), false);
	assert.equal(isValidPinFormat('12345'), false);
	assert.equal(isValidPinFormat(''), false);
});

test('token roundtrip and tampering', () => {
	const secret = 'a'.repeat(64);
	const t = makeToken(secret, 1000);
	assert.equal(checkToken(t, secret), true);
	assert.equal(checkToken(t.slice(0, -1) + (t.endsWith('0') ? '1' : '0'), secret), false);
	assert.equal(checkToken('v1.abc.def', secret), false);
	assert.equal(checkToken('', secret), false);
	assert.equal(checkToken(undefined, secret), false);
	assert.equal(checkToken(t, 'b'.repeat(64)), false);
});

test('limiter escalates 15m -> 1h -> 24h and resets', () => {
	const l = createLimiter();
	let now = 0;
	l.fail(now);
	l.fail(now);
	assert.equal(l.status(now).locked, false);
	l.fail(now);
	assert.deepEqual(l.status(now), { locked: true, retryAt: 15 * MIN });

	now = 15 * MIN;
	assert.equal(l.status(now).locked, false);
	l.fail(now); l.fail(now); l.fail(now);
	assert.deepEqual(l.status(now), { locked: true, retryAt: now + 60 * MIN });

	now += 60 * MIN;
	l.fail(now); l.fail(now); l.fail(now);
	assert.deepEqual(l.status(now), { locked: true, retryAt: now + 24 * 60 * MIN });

	now += 24 * 60 * MIN;
	l.fail(now); l.fail(now); l.fail(now);
	assert.deepEqual(l.status(now), { locked: true, retryAt: now + 24 * 60 * MIN });

	l.reset();
	assert.equal(l.status(now).locked, false);
	l.fail(now); l.fail(now); l.fail(now);
	assert.deepEqual(l.status(now), { locked: true, retryAt: now + 15 * MIN });
});

test('lockConfig', () => {
	assert.deepEqual(lockConfig({}, true), { enabled: false, configured: false });
	assert.deepEqual(lockConfig({}, false), { enabled: true, configured: false });
	const env = { RISE_PIN_HASH: 'scrypt$aa$bb', RISE_SECRET: 'c'.repeat(64) };
	assert.deepEqual(lockConfig(env, true), {
		enabled: true,
		configured: true,
		hash: env.RISE_PIN_HASH,
		secret: env.RISE_SECRET
	});
	// hash without a long enough secret is not configured
	assert.equal(lockConfig({ RISE_PIN_HASH: 'x', RISE_SECRET: 'short' }, false).configured, false);
});
