const CACHE_VERSION = 'kangal-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Static assets to pre-cache
const STATIC_ASSETS = [
    '/offline.html',
    '/icons/icon-192.svg',
    '/icons/icon-512.svg',
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
                    // Cache successful navigation responses
                    const clone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, clone);
                    });
                    return response;
                })
                .catch(() => {
                    // Try cached version, then offline page
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
