self.addEventListener('install', (event) => {
  // Placeholder SW for Sprint 1: real runtime caching strategy will be added in a dedicated sprint.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
