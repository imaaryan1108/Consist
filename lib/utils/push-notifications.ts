'use client'

// Converts a base64 URL-encoded VAPID public key to a Uint8Array
// required by the browser's pushManager.subscribe()
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('[push] serviceWorker or PushManager not supported')
    return false
  }

  const permission = await Notification.requestPermission()
  console.log('[push] notification permission:', permission)
  if (permission !== 'granted') return false

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) {
    console.error('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set')
    return false
  }

  console.log('[push] waiting for SW to be ready...')
  const registration = await navigator.serviceWorker.ready
  console.log('[push] SW ready, scope:', registration.scope)

  let subscription: PushSubscription
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })
    console.log('[push] subscription created, endpoint:', subscription.endpoint)
  } catch (err) {
    console.error('[push] pushManager.subscribe failed:', err)
    return false
  }

  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    })
    const data = await response.json()
    console.log('[push] save response:', response.status, data)
    return response.ok
  } catch (err) {
    console.error('[push] fetch to /api/push/subscribe failed:', err)
    return false
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    await subscription.unsubscribe()
  }

  const response = await fetch('/api/push/subscribe', { method: 'DELETE' })
  return response.ok
}

export async function getPermissionState(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}
