'use strict';
// Offline gyorsítótár: a játék internet nélkül is fut, ha egyszer betöltötted.
const CACHE = 'tt3-892e817a4b';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "src/art/backdrops.js",
  "src/art/buildings.js",
  "src/art/figure.js",
  "src/art/tiles.js",
  "src/data/achievements.js",
  "src/data/events.js",
  "src/data/figures.js",
  "src/data/moves.js",
  "src/data/news.js",
  "src/data/progress.js",
  "src/data/quests.js",
  "src/data/skins3d.js",
  "src/data/types.js",
  "src/data/world.js",
  "src/engine/audio.js",
  "src/engine/core.js",
  "src/engine/custom.js",
  "src/engine/draw.js",
  "src/engine/fx.js",
  "src/engine/input.js",
  "src/engine/model3d.js",
  "src/engine/save.js",
  "src/engine/ui.js",
  "src/engine/util.js",
  "src/main.js",
  "src/scenes/academy.js",
  "src/scenes/battle.js",
  "src/scenes/collection.js",
  "src/scenes/credits.js",
  "src/scenes/dome.js",
  "src/scenes/factory.js",
  "src/scenes/memory.js",
  "src/scenes/mirror.js",
  "src/scenes/pizzagame.js",
  "src/scenes/quiz.js",
  "src/scenes/shop.js",
  "src/scenes/title.js",
  "src/scenes/tower.js",
  "src/scenes/training.js",
  "src/scenes/wheel.js",
  "src/scenes/world.js",
  "assets/fonts/TT3Display.woff2",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Hálózat először (frissítésekhez), ha nincs net, a gyorsítótárból
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
