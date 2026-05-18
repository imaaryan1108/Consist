'use server'

import { createClient } from '@supabase/supabase-js'
import { CHAPTERS } from '@/lib/gamification/titles-config'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Get or initialize the gamification start date for a circle.
// Uses Chapter 1's started_at if it exists, otherwise seeds today as day 1.
async function getGamificationStart(supabase: any, circleId: string): Promise<Date> {
  const { data: ch1 } = await supabase
    .from('circle_chapters')
    .select('started_at')
    .eq('circle_id', circleId)
    .eq('chapter_number', 1)
    .single()

  if (ch1?.started_at) return new Date(ch1.started_at)

  // First time — seed Chapter 1 starting today
  const today = new Date().toISOString().split('T')[0]
  await supabase.from('circle_chapters').upsert({
    circle_id: circleId,
    chapter_number: 1,
    chapter_name: CHAPTERS[0].name,
    started_at: today,
    is_complete: false,
  }, { onConflict: 'circle_id,chapter_number' })

  return new Date(today)
}

export async function checkAndUpdateChapter(circleId: string) {
  const supabase = serviceClient()

  const { data: members } = await supabase
    .from('users').select('id').eq('circle_id', circleId)

  if (!members?.length) return null

  const memberCount = members.length
  const memberIds = members.map((m: any) => m.id)
  const today = new Date()

  const gamificationStart = await getGamificationStart(supabase, circleId)
  const daysSinceStart = Math.floor((today.getTime() - gamificationStart.getTime()) / 86400000) + 1

  const currentChapter = CHAPTERS.find(
    c => daysSinceStart >= c.days[0] && daysSinceStart <= c.days[1]
  )
  if (!currentChapter) return null

  const { data: existing } = await supabase
    .from('circle_chapters').select('*')
    .eq('circle_id', circleId)
    .eq('chapter_number', currentChapter.number)
    .single()

  if (existing?.is_complete) return existing

  // Calculate this chapter's date window
  const chapterStart = new Date(gamificationStart)
  chapterStart.setDate(chapterStart.getDate() + currentChapter.days[0] - 1)
  const chapterEnd = new Date(gamificationStart)
  chapterEnd.setDate(chapterEnd.getDate() + currentChapter.days[1] - 1)

  const startStr = chapterStart.toISOString().split('T')[0]
  const endStr = chapterEnd.toISOString().split('T')[0]

  const { count: punchIns } = await supabase
    .from('consist_logs').select('*', { count: 'exact', head: true })
    .in('user_id', memberIds).gte('date', startStr).lte('date', endStr)

  const daysElapsed = Math.min(
    daysSinceStart - currentChapter.days[0] + 1,
    currentChapter.days[1] - currentChapter.days[0] + 1
  )
  const possiblePunchIns = memberCount * daysElapsed
  const rate = possiblePunchIns > 0 ? ((punchIns ?? 0) / possiblePunchIns) * 100 : 0
  const isComplete = rate >= currentChapter.threshold && daysSinceStart >= currentChapter.days[1]

  await supabase.from('circle_chapters').upsert({
    circle_id: circleId,
    chapter_number: currentChapter.number,
    chapter_name: currentChapter.name,
    started_at: startStr,
    punch_in_rate: parseFloat(rate.toFixed(2)),
    is_complete: isComplete,
    ...(isComplete ? { completed_at: new Date().toISOString() } : {}),
  }, { onConflict: 'circle_id,chapter_number' })

  return { ...currentChapter, rate, isComplete, daysElapsed, possiblePunchIns, punchIns }
}

export async function getCircleChapters(circleId: string) {
  try {
    const supabase = serviceClient()
    const { data } = await supabase
      .from('circle_chapters').select('*')
      .eq('circle_id', circleId)
      .order('chapter_number', { ascending: true })
    return data ?? []
  } catch {
    return []
  }
}

export async function getCurrentChapterProgress(circleId: string) {
  try {
    const supabase = serviceClient()

    const { data: members } = await supabase
      .from('users').select('id').eq('circle_id', circleId)
    if (!members?.length) return null

    const today = new Date()
    const gamificationStart = await getGamificationStart(supabase, circleId)
    const daysSinceStart = Math.floor((today.getTime() - gamificationStart.getTime()) / 86400000) + 1

    const currentChapter = CHAPTERS.find(
      c => daysSinceStart >= c.days[0] && daysSinceStart <= c.days[1]
    ) ?? CHAPTERS[0]

    const memberIds = members.map((m: any) => m.id)
    const chapterStart = new Date(gamificationStart)
    chapterStart.setDate(chapterStart.getDate() + currentChapter.days[0] - 1)
    const startStr = chapterStart.toISOString().split('T')[0]
    const endStr = today.toISOString().split('T')[0]

    const { count: punchIns } = await supabase
      .from('consist_logs').select('*', { count: 'exact', head: true })
      .in('user_id', memberIds).gte('date', startStr).lte('date', endStr)

    const daysElapsed = Math.min(
      daysSinceStart - currentChapter.days[0] + 1,
      currentChapter.days[1] - currentChapter.days[0] + 1
    )
    const possible = members.length * daysElapsed
    const rate = possible > 0 ? ((punchIns ?? 0) / possible) * 100 : 0
    const daysLeft = Math.max(0, currentChapter.days[1] - daysSinceStart)

    return {
      chapter: currentChapter,
      rate: parseFloat(rate.toFixed(1)),
      punchIns: punchIns ?? 0,
      possible,
      daysLeft,
      daysSinceStart,
    }
  } catch {
    return null
  }
}
