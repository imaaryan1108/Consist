// Custom service worker extension for next-pwa
// Handles Web Push notifications and notification click events

self.addEventListener('push', function (event) {
  if (!event.data) return

  const data = event.data.json()
  const title = data.title || 'Consist'
  const options = {
    body: data.body || "Your circle is waiting. Have you consisted today?",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'daily-reminder',       // Collapses duplicate notifications
    renotify: true,              // Vibrate even if same tag
    requireInteraction: false,
    data: {
      url: data.url || '/dashboard',
    },
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      // If app is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
