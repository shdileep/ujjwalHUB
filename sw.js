// Version: 1.0.11 - Advanced PWA Store Compliance
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const CACHE_NAME = 'ujjwal-hub-offline-v1';
const OFFLINE_URL = '/offline.html';

// 1. Precache assets (This will be injected by Vite during build)
// self.__WB_MANIFEST is the injection point for vite-plugin-pwa
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// 2. Navigation Fallback for Offline Support
workbox.routing.registerRoute(
    new workbox.routing.NavigationRoute(
        async ({ event }) => {
            try {
                return await workbox.strategies.networkOnly().handle({ event });
            } catch (error) {
                return caches.match(OFFLINE_URL);
            }
        }
    )
);

// 3. Background Sync for reliable operations
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('sync-queue', {
    maxRetentionTime: 24 * 60 // Retry for max 24 Hours
});

workbox.routing.registerRoute(
    /\/api\/.*\//,
    new workbox.strategies.NetworkOnly({
        plugins: [bgSyncPlugin]
    }),
    'POST'
);

// 4. Periodic Sync Placeholder (Must be requested by the app)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-updates') {
        event.waitUntil((async () => {
            console.log('Periodic Sync: Checking for new data...');
            // Logic for background updates would go here
        })());
    }
});

// 5. Push Notifications Support
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'Ujjwal Hub', body: 'New update available!' };
    const options = {
        body: data.body || 'New waste management updates in your area.',
        icon: '/pwa_icon_192.png',
        badge: '/favicon.svg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            { action: 'explore', title: 'Open App', icon: '/favicon.svg' },
            { action: 'close', title: 'Close', icon: '/favicon.svg' },
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Ujjwal Hub', options)
    );
});

// 6. Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'explore') {
        event.waitUntil(clients.openWindow('/'));
    }
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
