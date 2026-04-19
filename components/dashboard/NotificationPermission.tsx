'use client'

import { useEffect, useState } from 'react'
import { subscribeToPush, getPermissionState } from '@/lib/utils/push-notifications'

export function NotificationPermission() {
  const [state, setState] = useState<'idle' | 'prompt' | 'granted' | 'denied' | 'unsupported'>('idle')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // On iOS, push only works when installed as a PWA (standalone mode)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isIOS && !isStandalone) {
      setState('unsupported')
      return
    }

    getPermissionState().then(permission => {
      if (permission === 'unsupported') {
        setState('unsupported')
      } else if (permission === 'granted') {
        setState('granted')
      } else if (permission === 'denied') {
        setState('denied')
      } else {
        // 'default' — never asked before, show the prompt banner
        setState('prompt')
      }
    })
  }, [])

  async function handleEnable() {
    setLoading(true)
    const success = await subscribeToPush()
    setLoading(false)
    setState(success ? 'granted' : 'denied')
  }

  // Don't render anything if granted, denied, or unsupported
  if (state !== 'prompt') return null

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-green-500/20 bg-green-900/10 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-xl">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-200">Enable daily reminders</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Get a nudge at 6 PM if you haven't consisted yet. Your circle is counting on you.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="rounded-lg bg-green-500 px-4 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-green-400 disabled:opacity-50"
            >
              {loading ? 'Enabling…' : 'Enable'}
            </button>
            <button
              onClick={() => setState('granted')} // dismiss without enabling
              className="rounded-lg px-3 py-1.5 text-xs text-slate-500 transition hover:text-slate-300"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
