'use server'

import { createClient } from '@supabase/supabase-js'
import { TITLES } from '@/lib/gamification/titles-config'

export interface TitleProgress {
  title_key: string
  current: number
  required: number
  pct: number         // 0–100
  earned: boolean
  is_active: boolean
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getTitleProgress(userId: string): Promise<TitleProgress[]> {
  try {
  const supabase = serviceClient()

  const [
    { data: user },
    { data: earnedTitles },
    { count: pushCount },
    { count: mealCount },
    { data: recentMealDays },
    { data: pushedLogs },
    { data: consistLogs },
  ] = await Promise.all([
    supabase.from('users').select('current_streak, longest_streak').eq('id', userId).single(),
    supabase.from('user_titles').select('title_key, is_active').eq('user_id', userId),
    supabase.from('pushes').select('*', { count: 'exact', head: true }).eq('from_user_id', userId),
    supabase.from('meal_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('meal_logs').select('date').eq('user_id', userId).order('date', { ascending: false }).limit(30),
    supabase.from('pushes').select('date').eq('to_user_id', userId),
    supabase.from('consist_logs').select('date').eq('user_id', userId),
  ])

  const earnedKeys = new Set((earnedTitles ?? []).map(t => t.title_key))
  const activeKey = (earnedTitles ?? []).find(t => t.is_active)?.title_key

  const streak = user?.current_streak ?? 0
  const pushes = pushCount ?? 0
  const meals = mealCount ?? 0

  // Calculate consecutive meal days
  const uniqueMealDays = [...new Set((recentMealDays ?? []).map(m => m.date))].sort().reverse()
  let consecutiveMealDays = 0
  for (let i = 0; i < uniqueMealDays.length - 1; i++) {
    const diff = (new Date(uniqueMealDays[i]).getTime() - new Date(uniqueMealDays[i + 1]).getTime()) / 86400000
    if (diff === 1) consecutiveMealDays++
    else break
  }
  if (uniqueMealDays.length > 0) consecutiveMealDays++ // count the first day

  // Check iron_will: pushed and still consisted same day
  let ironWillProgress = 0
  if (pushedLogs?.length && consistLogs?.length) {
    const pushedDates = new Set(pushedLogs.map(p => p.date))
    const consistDates = new Set(consistLogs.map(c => c.date))
    const overlap = [...pushedDates].filter(d => consistDates.has(d))
    ironWillProgress = Math.min(1, overlap.length)
  }

  // Check comeback_kid: had a streak break + rebuilt to 3+
  const comebackProgress =
    (user?.longest_streak ?? 0) > streak && streak >= 3 ? 1 : 0

  const definitions: Record<string, { current: number; required: number }> = {
    anchor:       { current: Math.min(streak, 3),                required: 3 },
    ghost:        { current: Math.min(streak, 7),                required: 7 },
    machine:      { current: Math.min(streak, 14),               required: 14 },
    pusher:       { current: Math.min(pushes, 5),                required: 5 },
    comeback_kid: { current: comebackProgress,                   required: 1 },
    iron_will:    { current: ironWillProgress,                   required: 1 },
    feeder:       { current: Math.min(meals, 5),                 required: 5 },
    macro_god:    { current: Math.min(consecutiveMealDays, 3),   required: 3 },
  }

  return Object.keys(TITLES).map(key => {
    const def = definitions[key] ?? { current: 0, required: 1 }
    const earned = earnedKeys.has(key)
    return {
      title_key: key,
      current: def.current,
      required: def.required,
      pct: earned ? 100 : Math.round((def.current / def.required) * 100),
      earned,
      is_active: activeKey === key,
    }
  })
  } catch {
    return []
  }
}

export async function getNextTitle(userId: string): Promise<TitleProgress | null> {
  const all = await getTitleProgress(userId)
  // Find the closest unearned title (highest pct, not 100)
  const unearned = all.filter(t => !t.earned).sort((a, b) => b.pct - a.pct)
  return unearned[0] ?? null
}
