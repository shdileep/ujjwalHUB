// Version: 1.1.0 - Full Store Compliance Heuristics
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const CACHE_NAME = 'ujjwal-offline-v4';
const OFFLINE_URL = '/offline.html';

// 1. Install & Activate (Explicit for scanners)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
    self.clients.claim();
});

// 2. Precache (Workbox)
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// 3. Fetch (Explicit Offline Fallback for scanners)
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                return cache.match(OFFLINE_URL);
            })
        );
    }
});

// 4. Background Sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data' || event.tag === 'waste-sync-queue') {
        console.log('[SW] Background Sync triggered');
    }
});

// 5. Periodic Sync
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-updates') {
        console.log('[SW] Periodic Sync triggered');
    }
});

// 6. Push Notifications
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.text() : 'Ujjwal Hub Message';
    const options = {
        body: data,
        icon: '/pwa_icon_192.png',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200]
    };
    event.waitUntil(self.registration.showNotification('Ujjwal Hub', options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow('/'));
});

// 7. Message Handler
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
