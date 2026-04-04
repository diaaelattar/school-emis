// EMIS Service Worker v7 - Fixed
const CACHE_NAME = 'emis-v7';
const DYNAMIC_CACHE = 'emis-dynamic-v1';

// فقط نخزن الملفات الأساسية التي نعرفها، نترك الباقي للشبكة
const STATIC_ASSETS = [
  './',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { mode: 'cors' })))
        .catch(err => console.warn('Cache addAll failed for some assets:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Never cache GitHub API calls
  if (event.request.url.includes('api.github.com')) return;
  
  // استراتيجية: Cache First ثم Network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      
      return fetch(event.request).then(response => {
        // لا نخزن الاستجابات غير الناجحة أو الاستجابات من CDN ذات no-cors
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    }).catch(() => {
      // Fallback - فقط للملفات الأساسية
      if (event.request.mode === 'navigate') {
        return caches.match('./');
      }
      return new Response('⚠ غير متصل حالياً', { status: 503 });
    })
  );
});
