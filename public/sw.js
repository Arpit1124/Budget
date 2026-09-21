// BudgetAI Gov - Progressive Web App Service Worker
// Offline Caching & Unstable Network Resiliency Layer

const CACHE_NAME = 'budget-gov-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Service Worker: Some static assets failed to pre-cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First with Cache Fallback for API, Cache-First for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (handled by IndexedDB offline queue)
  if (request.method !== 'GET') {
    return;
  }

  // Never intercept Vite dev server routes, node_modules, or HMR
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.includes('vite') ||
    url.pathname.includes('hot-update')
  ) {
    return;
  }

  // Handle API requests: Network-First with Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Unstable or disconnected network: serve from cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            // Add custom header to indicate offline cached response
            const headers = new Headers(cachedResponse.headers);
            headers.set('X-BudgetGov-Offline-Cached', 'true');
            return new Response(cachedResponse.body, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers,
            });
          }
          // Return generic offline JSON fallback if not in cache
          return new Response(
            JSON.stringify({
              _offline: true,
              message: 'Government network connection unavailable. Operating in offline cache mode.',
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // Handle Static Assets & HTML Navigation: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok && request.url.startsWith('http')) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is an HTML navigation, return cached root
          if (request.mode === 'navigate') {
            return caches.match('/index.html') || cachedResponse;
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Background Sync / Messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CHECK_SYNC_STATUS') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        type: 'SYNC_STATUS_RESPONSE',
        swActive: true,
        cacheName: CACHE_NAME,
        timestamp: Date.now(),
      });
    }
  }
});
