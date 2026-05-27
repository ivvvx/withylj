const CACHE = 'withylj-v1'
const ASSETS = [
  '/',
  '/about/',
  '/albums/',
  '/timeline/',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  )
})

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(e.request, clone))
        }
        return response
      })
      return cached || fetchPromise
    })
  )
})
