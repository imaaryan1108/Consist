import posthog from 'posthog-js'

export const POSTHOG_KEY = 'phc_xmMTzwVG4CwUWKNx9nMTCEKezi96YhYz3guiwXUHTaAJ'
export const POSTHOG_HOST = 'https://us.i.posthog.com'

export function initPostHog() {
  if (typeof window === 'undefined') return
  if (posthog.__loaded) return

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    session_recording: { maskAllInputs: false, maskInputOptions: { password: true } },
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.debug()
    },
  })
}

export { posthog }
