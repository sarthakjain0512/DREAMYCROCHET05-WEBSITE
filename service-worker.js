const CACHE_NAME = 'dreamycrochet-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/style-tailwind.css',
  '/app.js',
  '/config/apiConfig.js',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/logo.jpg',
  '/images/product-placeholder.webp',
  '/photoes/hero_cover.webp',
  '/photoes/hands_crocheting_flower.webp',
  '/photoes/instagram_screenshot.webp',
  '/public/icons/favicon-16x16.png',
  '/public/icons/favicon-32x32.png',
  '/public/icons/icon-72x72.png',
  '/public/icons/icon-96x96.png',
  '/public/icons/icon-128x128.png',
  '/public/icons/icon-144x144.png',
  '/public/icons/icon-152x152.png',
  '/public/icons/icon-180x180.png',
  '/public/icons/icon-192x192.png',
  '/public/icons/icon-192x192-maskable.png',
  '/public/icons/icon-256x256.png',
  '/public/icons/icon-384x384.png',
  '/public/icons/icon-512x512.png',
  '/public/icons/icon-512x512-maskable.png',
  '/offline.html'
];

// Install Event - Pre-cache core static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cache => cache !== CACHE_NAME)
          .map(cache => {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic routing and caching strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. API Requests -> Network Only
  if (url.pathname.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Admin Dashboard Requests -> Network Only
  if (url.pathname.includes('/dreamycrochet05-admin')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 3. Cloudinary Images -> Network First
  if (url.hostname.includes('res.cloudinary.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // 4. HTML Documents -> Network First (e.g. navigation / root / .html pages)
  const isHtml = event.request.mode === 'navigate' ||
                 url.pathname.endsWith('.html') ||
                 url.pathname === '/';

  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // 5. Static Assets (CSS, JS, Fonts, local icons/images) -> Cache First
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then(response => {
          // Cache successful responses or opaque CDN resources
          if (!response || (response.status !== 200 && response.status !== 0)) {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });

          return response;
        });
      })
  );
});
