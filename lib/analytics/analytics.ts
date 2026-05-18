'use client'

import { posthog } from './posthog'

// Identify user after login — call once auth resolves
export function identifyUser(userId: string, props?: { email?: string; name?: string }) {
  posthog.identify(userId, props)
}

// Reset on logout
export function resetAnalytics() {
  posthog.reset()
}

// ── Auth ──────────────────────────────────────────────
export const track = {
  // Onboarding
  onboardingStarted: () =>
    posthog.capture('onboarding_started'),

  onboardingCompleted: (props: { circle_action: 'created' | 'joined' }) =>
    posthog.capture('onboarding_completed', props),

  circleCreated: () =>
    posthog.capture('circle_created'),

  circleJoined: () =>
    posthog.capture('circle_joined'),

  // Core actions
  punchIn: (props: { streak: number; points: number; was_pushed: boolean; is_new_record: boolean }) =>
    posthog.capture('punch_in', props),

  pushSent: (props: { remaining_pushes: number }) =>
    posthog.capture('push_sent', props),

  // Meals
  mealLogged: (props: { meal_type: string; calories: number; used_ai_assist: boolean; has_macros: boolean }) =>
    posthog.capture('meal_logged', props),

  aiAssistUsed: (props: { food_name: string; success: boolean }) =>
    posthog.capture('ai_assist_used', props),

  // Goals & profile
  targetSet: (props: { target_weight: number; days_to_goal: number; used_ai_macros: boolean }) =>
    posthog.capture('target_set', props),

  aiMacrosSuggested: (props: { current_weight: number; target_weight: number; days_to_goal: number }) =>
    posthog.capture('ai_macros_suggested', props),

  bodyProfileUpdated: (props: { has_measurements: boolean }) =>
    posthog.capture('body_profile_updated', props),

  weeklyCheckinSubmitted: (props: { weight_change_kg: number }) =>
    posthog.capture('weekly_checkin_submitted', props),

  // Notifications
  notificationEnabled: () =>
    posthog.capture('notification_enabled'),

  notificationDismissed: () =>
    posthog.capture('notification_dismissed'),

  // Engagement
  circleCodeCopied: () =>
    posthog.capture('circle_code_copied'),
}
