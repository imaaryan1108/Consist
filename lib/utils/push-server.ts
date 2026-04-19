import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

// Server-only utility — never import this in client components
// Uses the service role key to bypass RLS and reach all circle members' subscriptions

function initWebPush() {
  webpush.setVapidDetails(
    'mailto:' + process.env.VAPID_CONTACT_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  return webpush
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Send push to all circle members EXCEPT the actor who triggered it
export async function notifyCircleMembers({
  circleId,
  excludeUserId,
  excludeUserIds,
  title,
  body,
  url = '/dashboard',
}: {
  circleId: string
  excludeUserId: string        // primary excluded user (the actor)
  excludeUserIds?: string[]    // optional additional exclusions (e.g. push target)
  title: string
  body: string
  url?: string
}) {
  try {
    const wp = initWebPush()
    const supabase = serviceClient()

    const excluded = new Set([excludeUserId, ...(excludeUserIds ?? [])])
    console.log('[push] notifyCircleMembers — circleId:', circleId, 'excluded:', [...excluded])

    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id')
      .eq('circle_id', circleId)

    console.log('[push] members in circle:', members, 'error:', membersError)

    const filteredMembers = (members ?? []).filter(m => !excluded.has(m.id))
    console.log('[push] filtered members to notify:', filteredMembers)

    if (!filteredMembers.length) {
      console.log('[push] no members to notify, returning')
      return
    }

    const memberIds = filteredMembers.map(m => m.id)

    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .in('user_id', memberIds)

    console.log('[push] subscriptions found:', subscriptions?.length, 'error:', subsError)

    if (!subscriptions?.length) return

    const payload = JSON.stringify({ title, body, url })

    const results = await Promise.allSettled(
      subscriptions.map(row => wp.sendNotification(row.subscription as any, payload))
    )
    console.log('[push] send results:', results.map(r => r.status))
  } catch (err) {
    console.error('[push] notifyCircleMembers failed:', err)
  }
}

// Send push to a single specific user
export async function notifyUser({
  userId,
  title,
  body,
  url = '/dashboard',
}: {
  userId: string
  title: string
  body: string
  url?: string
}) {
  try {
    const wp = initWebPush()
    const supabase = serviceClient()

    const { data: sub } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single()

    if (!sub) return

    const payload = JSON.stringify({ title, body, url })
    await wp.sendNotification(sub.subscription as any, payload)
  } catch (err) {
    console.error('[push] notifyUser failed:', err)
  }
}
