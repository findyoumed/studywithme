const CACHE_NAME = 'studywithme-v1';
const ASSETS = [
  './',
  './blog',
  './style.css',
  './blog.css',
  './css/layout.css',
  './css/intro-modal.css',
  './css/intro-modal/base.css',
  './css/intro-modal/content.css',
  './css/intro-modal/controls.css',
  './css/intro-modal/responsive.css',
  './css/intro-modal/steps.css',
  './css/autoplay-overlay.css',
  './script.js',
  './blog.js',
  './js/app-lifecycle-manager.js',
  './js/blog-i18n.js',
  './js/blog-renderer.js',
  './js/console-filter.js',
  './js/exercise-timer.js',
  './js/global-api.js',
  './js/i18n-data.js',
  './js/i18n-manager.js',
  './js/intro-modal.js',
  './js/modal-manager.js',
  './js/motion-manager.js',
  './js/player-controller.js',
  './js/player-state-handler.js',
  './js/playlist-manager.js',
  './js/playlist-url-handler.js',
  './js/share-score.js',
  './js/storage-manager.js',
  './js/ui-controls.js',
  './js/visibility-manager.js',
  './js/camera-manager.js',
  './js/youtube-api-helper.js',
  './components/about_modal.html',
  './components/controls_content.html',
  './components/mobile_menu.html',
  './icon-192.png',
  './icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip YouTube and external API calls
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        // Return cached response if found
        if (cached) return cached;

        // Otherwise fetch from network
        return fetch(event.request).then((response) => {
          // Don't cache if response is not valid
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone response to cache it
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});
