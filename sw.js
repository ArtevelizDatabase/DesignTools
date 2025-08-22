// Service Worker for DesignTools PWA
// Version 1.0.0

const CACHE_NAME = 'designtools-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const CACHE_URLS = [
  '/',
  '/index.html',
  '/csv-compare.html',
  '/keyword-bank.html',
  '/resize-image.html',
  '/DescriptionGRConverter.html',
  '/CalculatorGaji.html',
  '/css/common.css',
  '/css/keyword-bank.css',
  '/css/resize-image.css',
  '/css/analytics.css',
  '/js/common.js',
  '/js/keyword-bank.js',
  '/js/csv-compare.js',
  '/js/resize-image.js',
  '/js/config.js',
  '/js/supabase-service.js',
  '/js/worker.js',
  '/site.webmanifest',
  'https://cdn.tailwindcss.com/3.4.0',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0'
];

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching essential files');
        return cache.addAll(CACHE_URLS.map(url => new Request(url, { mode: 'no-cors' })));
      })
      .catch(err => {
        console.error('Service Worker: Cache failed', err);
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Ensure the service worker takes control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.startsWith('https://cdn.tailwindcss.com') &&
      !event.request.url.startsWith('https://cdn.jsdelivr.net') &&
      !event.request.url.startsWith('https://fonts.googleapis.com') &&
      !event.request.url.startsWith('https://fonts.gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Add to cache for future requests
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('Service Worker: Cached new resource', event.request.url);
              });
            
            return response;
          })
          .catch(err => {
            console.log('Service Worker: Fetch failed, serving offline page', err);
            
            // For navigation requests, serve offline page
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL) || caches.match('/');
            }
            
            // For other requests, just fail
            throw err;
          });
      })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync tasks here
      doBackgroundSync()
    );
  }
});

// Push notification handler
self.addEventListener('push', event => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'DesignTools notification',
    icon: 'https://via.placeholder.com/192x192/3b82f6/ffffff?text=DT',
    badge: 'https://via.placeholder.com/72x72/3b82f6/ffffff?text=DT',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open DesignTools',
        icon: 'https://via.placeholder.com/24x24/3b82f6/ffffff?text=→'
      },
      {
        action: 'close',
        title: 'Close',
        icon: 'https://via.placeholder.com/24x24/ef4444/ffffff?text=×'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('DesignTools', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function for background sync
async function doBackgroundSync() {
  try {
    // Check if we can sync data with Supabase
    if ('indexedDB' in window) {
      console.log('Service Worker: Performing background sync');
      // Add your background sync logic here
      // For example, sync offline keyword data to Supabase
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Message handler for communication with main thread
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});