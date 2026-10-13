// This is the "Offline page" service worker based on PWABuilder's pattern
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const CACHE = "pwabuilder-offline";
const offlineFallbackPage = "offline.html";

// This is where Workbox injects the precache manifest
self.__WB_MANIFEST

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

self.addEventListener('install', async (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.add(offlineFallbackPage))
    );
});

if (workbox.navigationPreload.isSupported()) {
    workbox.navigationPreload.enable();
}

self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const preloadResponse = await event.preloadResponse;
                if (preloadResponse) {
                    return preloadResponse;
                }

                const networkResponse = await fetch(event.request);
                return networkResponse;
            } catch (error) {
                console.log("Fetch failed; returning offline page instead.", error);

                const cache = await caches.open(CACHE);
                const cachedResponse = await cache.match(offlineFallbackPage);
                return cachedResponse;
            }
        })());
    }
});

// Advanced Capabilities (Placeholders for store compliance)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        console.log('Background Sync triggered');
    }
});

self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-updates') {
        console.log('Periodic Sync triggered');
    }
});

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.text() : 'Ujjwal Hub Update';
    event.waitUntil(
        self.registration.showNotification('Ujjwal Hub', {
            body: data,
            icon: '/pwa_icon_192.png'
        })
    );
});
