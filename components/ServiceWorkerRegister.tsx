'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[SW] Registered, scope:', reg.scope)

        // When a new SW takes over, reload once so stale chunk references are cleared
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })
      })
      .catch(err => console.error('[SW] Registration failed:', err))
  }, [])

  return null
}
