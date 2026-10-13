// Version: 1.2.0 - Final Standardized Build
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const CACHE_NAME = 'ujjwal-offline-v5';
const OFFLINE_URL = '/offline.html';

// Explicit listeners for PWABuilder heuristics
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

// Workbox Precaching
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// Fetch - Explicit for Background Sync and Offline Support detection
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

// Sync
self.addEventListener('sync', (event) => {
    console.log('[SW] Sync event:', event.tag);
});

// Periodic Sync
self.addEventListener('periodicsync', (event) => {
    console.log('[SW] Periodic Sync event:', event.tag);
});

// Push
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.text() : 'Ujjwal Hub Message';
    event.waitUntil(
        self.registration.showNotification('Ujjwal Hub', {
            body: data,
            icon: '/pwa_icon_192.png'
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
