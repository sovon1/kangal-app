const CACHE_VERSION = 'kangal-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Prevent Cache Bloat by limiting the number of files stored
const limitCacheSize = (name, size) => {
    caches.open(name).then((cache) => {
        cache.keys().then((keys) => {
            if (keys.length > size) {
                // Delete oldest cache entry recursively until under size limit
                cache.delete(keys[0]).then(() => limitCacheSize(name, size));
            }
        });
    });
};

// Static assets to pre-cache
const STATIC_ASSETS = [
    '/offline.html',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/auth-bg.png',
];

// Install event — pre-cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch event — caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip Supabase API calls and auth-related requests
    if (url.hostname.includes('supabase') || url.pathname.startsWith('/auth')) {
        return;
    }

    // For navigation requests — Network First with offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, clone);
                        limitCacheSize(DYNAMIC_CACHE, 50);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((cached) => {
                        return cached || caches.match('/offline.html');
                    });
                })
        );
        return;
    }

    // For static assets (JS, CSS, images, fonts) — Cache First
    if (
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|avif|ico)$/)
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    const clone = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => {
                        cache.put(request, clone);
                        limitCacheSize(STATIC_CACHE, 150);
                    });
                    return response;
                });
            })
        );
        return;
    }

    // For API/data requests — Network First with cache fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                const clone = response.clone();
                caches.open(DYNAMIC_CACHE).then((cache) => {
                    cache.put(request, clone);
                    limitCacheSize(DYNAMIC_CACHE, 50);
                });
                return response;
            })
            .catch(() => {
                return caches.match(request);
            })
    );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// --- Push Notification Handlers ---

// Handle incoming push messages
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const payload = event.data.json();

        const options = {
            body: payload.body || 'You have a new update.',
            icon: payload.icon || '/icons/icon-192.png',
            badge: '/icons/icon-192.png', // Small icon for Android status bar
            vibrate: [100, 50, 100],
            data: {
                url: payload.click_action || '/', // Where to go when clicked
            },
            requireInteraction: true,
        };

        event.waitUntil(
            self.registration.showNotification(payload.title || 'KANGAL', options)
        );
    } catch (e) {
        console.error('Error parsing push payload:', e);
        // Fallback for plain text pushes
        event.waitUntil(
            self.registration.showNotification('KANGAL', {
                body: event.data.text(),
                icon: '/icons/icon-192.png',
            })
        );
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            const client = windowClients.find((c) => c.url === new URL(urlToOpen, self.location.origin).href);

            if (client && 'focus' in client) {
                // If so, just focus it
                return client.focus();
            } else if (self.clients.openWindow) {
                // If not, open a new window
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
