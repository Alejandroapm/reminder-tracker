const CACHE_NAME = "reminder-tracker-v1";
const APP_SHELL = ["./", "./manifest.webmanifest", "./icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./"));
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "SHOW_REMINDER") return;

  const reminder = event.data.reminder;
  self.registration.showNotification(reminder.title, {
    body: reminder.body,
    icon: "./icons/icon.svg",
    badge: "./icons/icon.svg",
    tag: reminder.id,
    renotify: true,
    data: { id: reminder.id },
    actions: [
      { action: "complete", title: "Complete" },
      { action: "snooze", title: "Snooze" }
    ]
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const url = new URL("./", self.location.href).href;
      const focused = clients.find((client) => client.url.startsWith(url));
      if (focused) return focused.focus();
      return self.clients.openWindow(url);
    }),
  );
});
