/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Rise service worker: makes Rise installable and opens fast (even offline, read-only).
import { self } from '$app/service-worker';
import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';

const CACHE = `rise-${version}`;
const PAGES = `rise-pages`;
const PRECACHE = [...immutable, ...assets].map((f) => '/' + f.path.replace(/^\//, ''));

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((c) => c.addAll(PRECACHE))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== PAGES).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return; // never touch form posts
	const url = new URL(req.url);
	if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

	// app code, fonts-free static files: cache first (they are versioned)
	if (PRECACHE.includes(url.pathname)) {
		event.respondWith(caches.match(req).then((hit) => hit ?? fetch(req)));
		return;
	}

	// pages + page data: network first, fall back to the last copy we saw
	event.respondWith(
		fetch(req)
			.then((res) => {
				// never keep the lock screen (or anything reached via a redirect) as a page copy
				if (res.ok && !res.redirected && url.pathname !== '/unlock') {
					const copy = res.clone();
					caches.open(PAGES).then((c) => c.put(req, copy));
				}
				return res;
			})
			.catch(async () => (await caches.match(req)) ?? offline())
	);
});

function offline() {
	return new Response(
		`<!doctype html><meta name=viewport content="width=device-width"><title>Rise · offline</title>
		<body style="font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#ddf5b3;color:#121212;text-align:center">
		<div><h1 style="font-size:48px;margin:0">offline ✱</h1><p>Rise can't reach the server.<br>Check your connection, then pull to refresh.</p></div>`,
		{ headers: { 'content-type': 'text/html; charset=utf-8' }, status: 503 }
	);
}
