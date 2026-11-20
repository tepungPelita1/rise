#!/usr/bin/env node
/**
 * Set (or change) the Rise PIN. The PIN is typed hidden and never printed.
 * Every change also makes a new RISE_SECRET, so all devices get locked.
 *
 *   node scripts/set-pin.mjs                     # print the two .env lines
 *   node scripts/set-pin.mjs --server ajamserver # write them into ~/rise/.env on the server
 *
 * Then restart Rise so it reads them:  .\deploy.ps1 restart
 */
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { PIN_LENGTH, hashPin, isValidPinFormat } from '../src/lib/server/lock.ts';

function ask(prompt) {
	return new Promise((resolve, reject) => {
		const { stdin, stderr } = process;
		if (!stdin.isTTY) return reject(new Error('run this in a terminal (needs hidden input)'));
		stderr.write(prompt);
		stdin.setRawMode(true);
		stdin.resume();
		stdin.setEncoding('utf8');
		let value = '';
		const onData = (ch) => {
			for (const c of ch) {
				if (c === '\r' || c === '\n') {
					stdin.setRawMode(false);
					stdin.pause();
					stdin.off('data', onData);
					stderr.write('\n');
					return resolve(value);
				}
				if (c === '\u0003') {
					stderr.write('\n');
					process.exit(130);
				}
				if (c === '\u007f' || c === '\b') {
					if (value) {
						value = value.slice(0, -1);
						stderr.write('\b \b');
					}
				} else if (/\d/.test(c)) {
					value += c;
					stderr.write('•');
				}
			}
		};
		stdin.on('data', onData);
	});
}

const i = process.argv.indexOf('--server');
const server = i > -1 ? process.argv[i + 1] : null;

const pin = await ask(`New ${PIN_LENGTH}-digit PIN: `);
if (!isValidPinFormat(pin)) {
	console.error(`PIN must be exactly ${PIN_LENGTH} digits. Nothing changed.`);
	process.exit(1);
}
if ((await ask('Again: ')) !== pin) {
	console.error('PINs do not match. Nothing changed.');
	process.exit(1);
}

// single quotes: docker compose and bash both read the value literally ($ in the hash)
const lines = `RISE_PIN_HASH='${hashPin(pin)}'\nRISE_SECRET='${randomBytes(32).toString('hex')}'\n`;

if (!server) {
	process.stdout.write(lines);
	process.exit(0);
}

const remote =
	'f="$HOME/rise/.env"; sed -i "/^RISE_PIN_HASH=/d;/^RISE_SECRET=/d" "$f" && cat >> "$f" && echo "PIN saved on $(hostname)"';
const r = spawnSync('ssh', ['-o', 'BatchMode=yes', server, remote], {
	input: lines,
	stdio: ['pipe', 'inherit', 'inherit']
});
if (r.status !== 0) {
	console.error(`ssh to ${server} failed. Nothing changed there.`);
	process.exit(1);
}
console.error('Now restart Rise:  .\\deploy.ps1 restart');
