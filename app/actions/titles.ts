'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { TITLES } from '@/lib/gamification/titles-config'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function checkAndAwardTitles(userId: string) {
  const supabase = serviceClient()

  // Get user stats
  const { data: user } = await supabase
    .from('users')
    .select('current_streak, longest_streak, total_days, circle_id')
    .eq('id', userId)
    .single()

  if (!user) return []

  const today = new Date().toISOString().split('T')[0]
  const newTitles: string[] = []

  // Get already earned titles
  const { data: earned } = await supabase
    .from('user_titles')
    .select('title_key')
    .eq('user_id', userId)

  const earnedKeys = new Set((earned ?? []).map(t => t.title_key))

  const award = async (key: string) => {
    if (earnedKeys.has(key)) return
    await supabase.from('user_titles').insert({ user_id: userId, title_key: key })
    newTitles.push(key)

    // Auto-set as active if it's their first title
    if (earnedKeys.size === 0 && newTitles.length === 1) {
      await supabase
        .from('user_titles')
        .update({ is_active: true })
        .eq('user_id', userId)
        .eq('title_key', key)
    }
  }

  // anchor — first 3-day streak
  if ((user.current_streak ?? 0) >= 3) await award('anchor')

  // ghost — 7-day streak
  if ((user.current_streak ?? 0) >= 7) await award('ghost')

  // machine — 14-day streak
  if ((user.current_streak ?? 0) >= 14) await award('machine')

  // pusher — 5+ pushes sent
  const { count: pushCount } = await supabase
    .from('pushes')
    .select('*', { count: 'exact', head: true })
    .eq('from_user_id', userId)

  if ((pushCount ?? 0) >= 5) await award('pusher')

  // comeback_kid — current streak > 0 AND longest_streak was broken before
  if ((user.current_streak ?? 0) >= 3 && (user.longest_streak ?? 0) > (user.current_streak ?? 0)) {
    await award('comeback_kid')
  }

  // iron_will — punched in on a day they were pushed
  const { data: pushedAndConsisted } = await supabase
    .from('pushes')
    .select('date')
    .eq('to_user_id', userId)

  if (pushedAndConsisted && pushedAndConsisted.length > 0) {
    const pushedDates = pushedAndConsisted.map(p => p.date)
    const { data: consistedOnPushedDay } = await supabase
      .from('consist_logs')
      .select('date')
      .eq('user_id', userId)
      .in('date', pushedDates)
      .limit(1)

    if (consistedOnPushedDay && consistedOnPushedDay.length > 0) await award('iron_will')
  }

  // feeder — 5+ meals logged
  const { count: mealCount } = await supabase
    .from('meal_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((mealCount ?? 0) >= 5) await award('feeder')

  // macro_god — hit macro targets 3 days in a row (has calorie logs for 3 consecutive days)
  const { data: recentMealDays } = await supabase
    .from('meal_logs')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30)

  if (recentMealDays) {
    const uniqueDays = [...new Set(recentMealDays.map(m => m.date))].sort().reverse()
    let consecutive = 0
    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const d1 = new Date(uniqueDays[i])
      const d2 = new Date(uniqueDays[i + 1])
      const diff = (d1.getTime() - d2.getTime()) / 86400000
      if (diff === 1) { consecutive++; if (consecutive >= 2) { await award('macro_god'); break } }
      else consecutive = 0
    }
  }

  return newTitles
}

export async function setActiveTitle(titleKey: string) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false }

  // Deactivate all, then activate selected
  await supabase.from('user_titles').update({ is_active: false }).eq('user_id', session.user.id)
  await supabase.from('user_titles').update({ is_active: true }).eq('user_id', session.user.id).eq('title_key', titleKey)
  return { success: true }
}

export async function getUserTitles(userId: string) {
  try {
    const supabase = await createServerClient()
    const { data } = await supabase
      .from('user_titles')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: true })
    return data ?? []
  } catch {
    return []
  }
}

export async function getActiveTitle(userId: string) {
  try {
    const supabase = await createServerClient()
    const { data } = await supabase
      .from('user_titles')
      .select('title_key')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()
    return data?.title_key ?? null
  } catch {
    return null
  }
}
