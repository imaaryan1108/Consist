import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_CONTACT_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

type ReminderType = 'gym' | 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'test'

// UTC minutes-since-midnight → reminder type
// IST = UTC+5:30, so IST hour:min → UTC = subtract 5h30m
const SCHEDULE: Record<number, ReminderType> = {
  [2 * 60 + 30]: 'gym',       // 08:00 IST
  [5 * 60 + 0]:  'breakfast', // 10:30 IST
  [9 * 60 + 0]:  'lunch',     // 14:30 IST
  [12 * 60 + 30]:'gym',       // 18:00 IST
  [13 * 60 + 0]: 'snack',     // 18:30 IST
  [17 * 60 + 0]: 'dinner',    // 22:30 IST
}

const MESSAGES: Record<ReminderType, { title: string; body: string; url: string }> = {
  breakfast: {
    title: 'Breakfast check 🍳',
    body: "Your circle's macros don't wait. Log breakfast before you forget.",
    url: '/tracking',
  },
  lunch: {
    title: "Lunch o'clock 🥗",
    body: "Half the day's gone. Don't let your macros be a mystery — log lunch.",
    url: '/tracking',
  },
  snack: {
    title: 'Snack check 🍎',
    body: 'Small wins add up. Log your snack before the day runs away.',
    url: '/tracking',
  },
  dinner: {
    title: 'Dinner time 🍽️',
    body: 'One meal away from a perfect day. Log dinner and close it out strong.',
    url: '/tracking',
  },
  gym: {
    title: 'Consist 💪',
    body: "Your circle is moving. Have you punched in today?",
    url: '/dashboard',
  },
  test: {
    title: 'Test flight 1',
    body: 'Sorry to disturb XD',
    url: '/dashboard',
  },
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const manualType = searchParams.get('type') as ReminderType | null

  // Auto-detect from schedule if no type passed
  let type: ReminderType | null = manualType
  if (!type) {
    const now = new Date()
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
    type = SCHEDULE[utcMinutes] ?? null
  }

  if (!type) {
    return NextResponse.json({ skipped: true, message: 'No reminder scheduled for this time' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().split('T')[0]
  const msg = MESSAGES[type]

  if (type === 'gym') {
    // Skip users who already consisted today
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('subscription, user:user_id(last_consist_date)')

    if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })

    const targets = (subs ?? []).filter((row: any) => row.user?.last_consist_date !== today)
    return sendAll(targets, msg)
  }

  if (type === 'test') {
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')

    if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })
    return sendAll(subs ?? [], msg)
  }

  // Meal reminder — skip users who already logged this meal type today
  const { data: loggedUsers } = await supabase
    .from('meal_logs')
    .select('user_id')
    .eq('date', today)
    .eq('meal_type', type)

  const loggedIds = new Set((loggedUsers ?? []).map((r: any) => r.user_id))

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('subscription, user_id')

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  const targets = (subs ?? []).filter((row: any) => !loggedIds.has(row.user_id))
  return sendAll(targets, msg)
}

async function sendAll(
  rows: any[],
  msg: { title: string; body: string; url: string }
) {
  const payload = JSON.stringify(msg)
  const results = await Promise.allSettled(
    rows.map((row: any) => webpush.sendNotification(row.subscription, payload))
  )
  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  return NextResponse.json({ sent, failed })
}
