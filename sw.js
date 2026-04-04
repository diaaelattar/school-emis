// EMIS Service Worker v7
// Place this file (sw.js) in the same folder as the HTML file on GitHub

var CACHE_NAME = 'emis-v7';
var ASSETS = [
  './',
  './منظومة_شئون_العاملين_v7.html',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS.map(function(url){ return new Request(url, {mode:'no-cors'}); })).catch(function(){});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // Never intercept GitHub API calls (always fresh)
  if(e.request.url.indexOf('api.github.com')>=0) return;
  e.respondWith(
    caches.match(e.request).then(function(cached){
      var fetchPromise = fetch(e.request).then(function(res){
        if(res&&res.status===200){
          var clone=res.clone();
          caches.open(CACHE_NAME).then(function(c){c.put(e.request,clone);});
        }
        return res;
      }).catch(function(){return cached;});
      return cached || fetchPromise;
    })
  );
});
