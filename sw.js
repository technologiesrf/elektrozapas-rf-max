
/*
 * Электрозапас РФ — кэш v7.5
 * Обновляет сайт и форму заказа.
 * Сохраняет возможность повторного открытия
 * при нестабильном интернете.
 */

const CACHE = "elektrozapas-rf-max-lite-v7-6-prices";

const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js?v=20261112",
  "./orders.js?v=76"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith("elektrozapas-rf-max-lite-") &&
            key !== CACHE
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  const isShell =
    request.mode === "navigate" ||
    /\/(index\.html|styles\.css|app\.js|orders\.js)$/
      .test(url.pathname);

  const isImage =
    /\/assets\/[^/]+\.webp$/i.test(url.pathname);

  if (!isShell && !isImage) return;

  // Для HTML, CSS и JS сначала проверяем
  // актуальную версию на сервере.
  if (isShell) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request, {
          cache: "no-store"
        });

        if (!fresh.ok) throw new Error("HTTP error");

        const cache = await caches.open(CACHE);
        await cache.put(request, fresh.clone());

        return fresh;
      } catch (error) {
        const cached = await caches.match(request);

        if (cached) return cached;

        if (request.mode === "navigate") {
          const fallback = await caches.match(
            new URL("./index.html", self.registration.scope)
          );

          if (fallback) return fallback;
        }

        return Response.error();
      }
    })());

    return;
  }

  // Фотографии экономно загружаются из кэша.
  if (isImage) {
    event.respondWith((async () => {
      const cached = await caches.match(request);

      if (cached) return cached;

      try {
        const fresh = await fetch(request);

        if (fresh.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(request, fresh.clone());
        }

        return fresh;
      } catch (error) {
        return Response.error();
      }
    })());
  }
});
