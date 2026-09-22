/* Neon Arcade service worker: keeps the site usable offline.
   - The hub, the credits and soundboard pages, the original games and the
     shared scripts are cached on install.
   - Anything else on this site (the open-source games, the sound clips) is
     cached the first time you use it. Media is served from the cache once it
     is there; pages and scripts are refreshed in the background.
   Bump VERSION to make every visitor pick up a fresh copy of everything. */

const VERSION = "2026-09-22";
const CACHE = "neon-arcade-" + VERSION;
const PRECACHE = [
  "./",
  "./2048.html",
  "./404.html",
  "./aim.html",
  "./airhockey.html",
  "./asteroids.html",
  "./blackjack.html",
  "./breakout.html",
  "./chess.html",
  "./connect4.html",
  "./credits.html",
  "./flappy.html",
  "./freecell.html",
  "./froggy.html",
  "./hangman.html",
  "./index.html",
  "./invaders.html",
  "./jump.html",
  "./lights.html",
  "./memory.html",
  "./minesweeper.html",
  "./missilecommand.html",
  "./neonbowl.html",
  "./play.html",
  "./pong.html",
  "./rps.html",
  "./simon.html",
  "./slide.html",
  "./snake.html",
  "./sokoban.html",
  "./solitaire.html",
  "./soundboard.html",
  "./sudoku.html",
  "./tetris.html",
  "./tictactoe.html",
  "./whack.html",
  "./word.html",
  "./assets/2048.js",
  "./assets/aim.js",
  "./assets/airhockey.js",
  "./assets/apple-touch-icon.png",
  "./assets/arcade.js",
  "./assets/asteroids.js",
  "./assets/blackjack.js",
  "./assets/breakout.js",
  "./assets/chess.js",
  "./assets/connect4.js",
  "./assets/flappy.js",
  "./assets/freecell.js",
  "./assets/froggy.js",
  "./assets/hangman.js",
  "./assets/hub.js",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/invaders.js",
  "./assets/jump.js",
  "./assets/lights.js",
  "./assets/memory.js",
  "./assets/mines.js",
  "./assets/missilecommand.js",
  "./assets/neonbowl.js",
  "./assets/og-image.png",
  "./assets/play.js",
  "./assets/pong.js",
  "./assets/rps.js",
  "./assets/simon.js",
  "./assets/slide.js",
  "./assets/snake.js",
  "./assets/sokoban.js",
  "./assets/solitaire.js",
  "./assets/soundboard.js",
  "./assets/sounds-kenney.json",
  "./assets/sounds.json",
  "./assets/style.css",
  "./assets/sudoku.js",
  "./assets/tetris.js",
  "./assets/ttt.js",
  "./assets/whack.js",
  "./assets/word.js",
  "./manifest.webmanifest"
];

const OFFLINE_PAGE = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline · Neon Arcade</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a14;color:#eaeaf8;font-family:system-ui,sans-serif;text-align:center;padding:24px}
h1{font-family:monospace;color:#00e5ff;letter-spacing:2px}p{color:#9494b8;max-width:32ch;line-height:1.5}a{color:#ff2e88}</style></head>
<body><div><h1>NO SIGNAL</h1><p>You're offline and this page hasn't been saved on this device yet. The original games and the hub still work.</p><p><a href="./index.html">Back to the arcade</a></p></div></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("neon-arcade-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache keys ignore query strings (the soundboard adds a cache-busting ?t=)
function keyFor(request) {
  const url = new URL(request.url);
  return url.origin + url.pathname;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(keyFor(request), fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(keyFor(request));
    return cached || new Response(OFFLINE_PAGE, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(keyFor(request));
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh.ok) cache.put(keyFor(request), fresh.clone());
  return fresh;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(keyFor(request));
  const refresh = fetch(request)
    .then((fresh) => { if (fresh.ok) cache.put(keyFor(request), fresh.clone()); return fresh; })
    .catch(() => cached);
  return cached || refresh;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // fonts and other third-party requests go straight to the network
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirst(request));
  } else if (/\.(mp3|ogg|wav|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|wasm)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});
