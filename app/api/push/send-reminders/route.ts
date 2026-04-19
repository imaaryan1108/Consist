import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_CONTACT_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

type ReminderType = 'gym' | 'breakfast' | 'lunch' | 'snack' | 'dinner'

const MEAL_MESSAGES: Record<Exclude<ReminderType, 'gym'>, { title: string; body: string }> = {
  breakfast: {
    title: 'Breakfast check 🍳',
    body: "Your circle's macros don't wait. Log breakfast before you forget.",
  },
  lunch: {
    title: 'Lunch o\'clock 🥗',
    body: "Half the day's gone. Don't let your macros be a mystery — log lunch.",
  },
  snack: {
    title: 'Snack check 🍎',
    body: "4PM. Small wins add up. Log your snack before the day runs away.",
  },
  dinner: {
    title: 'Dinner time 🍽️',
    body: "One meal away from a perfect day. Log dinner and close it out strong.",
  },
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = (searchParams.get('type') || 'gym') as ReminderType

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().split('T')[0]

  if (type === 'gym') {
    return sendGymReminders(supabase, today)
  } else {
    return sendMealReminders(supabase, today, type)
  }
}

// Notify users who haven't consisted today
async function sendGymReminders(supabase: any, today: string) {
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select(`
      subscription,
      user:user_id (
        id,
        name,
        last_consist_date,
        circles:circle_id ( name )
      )
    `)

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  const results = await Promise.allSettled(
    subscriptions
      .filter((row: any) => row.user?.last_consist_date !== today)
      .map(async (row: any) => {
        const circleName = row.user?.circles?.name || 'your circle'
        const payload = JSON.stringify({
          title: 'Consist 💪',
          body: `${circleName} is waiting. Have you consisted today?`,
          url: '/dashboard',
        })
        await webpush.sendNotification(row.subscription, payload)
      })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  return NextResponse.json({ type: 'gym', sent, failed })
}

// Notify users who haven't logged a specific meal type today
async function sendMealReminders(supabase: any, today: string, mealType: Exclude<ReminderType, 'gym'>) {
  const message = MEAL_MESSAGES[mealType]

  // Get all users who have logged this meal type today
  const { data: loggedUsers } = await supabase
    .from('meal_logs')
    .select('user_id')
    .eq('date', today)
    .eq('meal_type', mealType === 'snack' ? 'snack' : mealType)

  const loggedUserIds = new Set((loggedUsers || []).map((r: any) => r.user_id))

  // Get all subscriptions and filter out users who already logged
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('subscription, user_id')

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  const targets = subscriptions.filter((row: any) => !loggedUserIds.has(row.user_id))

  const results = await Promise.allSettled(
    targets.map(async (row: any) => {
      const payload = JSON.stringify({
        title: message.title,
        body: message.body,
        url: '/tracking',
      })
      await webpush.sendNotification(row.subscription, payload)
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  return NextResponse.json({ type: mealType, sent, failed })
}
