'use server'

import { createClient } from '@supabase/supabase-js'

export const CHAPTERS = [
  { number: 1, name: 'The Awakening', days: [1, 7],   threshold: 70, color: 'from-slate-500 to-slate-400' },
  { number: 2, name: 'The Grind',     days: [8, 14],  threshold: 75, color: 'from-blue-500 to-blue-400' },
  { number: 3, name: 'The Lock-in',   days: [15, 21], threshold: 80, color: 'from-violet-500 to-violet-400' },
  { number: 4, name: 'The Month',     days: [22, 30], threshold: 85, color: 'from-primary to-green-400' },
]

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function checkAndUpdateChapter(circleId: string) {
  const supabase = serviceClient()

  // Get circle members
  const { data: members } = await supabase
    .from('users')
    .select('id')
    .eq('circle_id', circleId)

  if (!members?.length) return null

  const memberCount = members.length
  const memberIds = members.map(m => m.id)

  // Get circle creation date (earliest user joined)
  const { data: circleData } = await supabase
    .from('circles')
    .select('created_at')
    .eq('id', circleId)
    .single()

  if (!circleData) return null

  const circleStart = new Date(circleData.created_at)
  const today = new Date()
  const daysSinceStart = Math.floor((today.getTime() - circleStart.getTime()) / 86400000) + 1

  // Find the current chapter
  const currentChapter = CHAPTERS.find(
    c => daysSinceStart >= c.days[0] && daysSinceStart <= c.days[1]
  )

  if (!currentChapter) return null

  // Check if already completed
  const { data: existing } = await supabase
    .from('circle_chapters')
    .select('*')
    .eq('circle_id', circleId)
    .eq('chapter_number', currentChapter.number)
    .single()

  if (existing?.is_complete) return existing

  // Calculate chapter window dates
  const chapterStart = new Date(circleStart)
  chapterStart.setDate(chapterStart.getDate() + currentChapter.days[0] - 1)
  const chapterEnd = new Date(circleStart)
  chapterEnd.setDate(chapterEnd.getDate() + currentChapter.days[1] - 1)

  const startStr = chapterStart.toISOString().split('T')[0]
  const endStr = chapterEnd.toISOString().split('T')[0]

  // Count actual punch-ins in this chapter window
  const { count: punchIns } = await supabase
    .from('consist_logs')
    .select('*', { count: 'exact', head: true })
    .in('user_id', memberIds)
    .gte('date', startStr)
    .lte('date', endStr)

  const daysElapsed = Math.min(
    daysSinceStart - currentChapter.days[0] + 1,
    currentChapter.days[1] - currentChapter.days[0] + 1
  )
  const possiblePunchIns = memberCount * daysElapsed
  const rate = possiblePunchIns > 0 ? ((punchIns ?? 0) / possiblePunchIns) * 100 : 0

  const isComplete = rate >= currentChapter.threshold && daysSinceStart >= currentChapter.days[1]

  // Upsert chapter record
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
  const supabase = serviceClient()
  const { data } = await supabase
    .from('circle_chapters')
    .select('*')
    .eq('circle_id', circleId)
    .order('chapter_number', { ascending: true })
  return data ?? []
}

export async function getCurrentChapterProgress(circleId: string) {
  const supabase = serviceClient()

  const { data: members } = await supabase
    .from('users').select('id').eq('circle_id', circleId)

  if (!members?.length) return null

  const { data: circleData } = await supabase
    .from('circles').select('created_at').eq('id', circleId).single()

  if (!circleData) return null

  const circleStart = new Date(circleData.created_at)
  const today = new Date()
  const daysSinceStart = Math.floor((today.getTime() - circleStart.getTime()) / 86400000) + 1

  const currentChapter = CHAPTERS.find(
    c => daysSinceStart >= c.days[0] && daysSinceStart <= c.days[1]
  ) ?? CHAPTERS[CHAPTERS.length - 1]

  const memberIds = members.map(m => m.id)
  const chapterStart = new Date(circleStart)
  chapterStart.setDate(chapterStart.getDate() + currentChapter.days[0] - 1)
  const startStr = chapterStart.toISOString().split('T')[0]
  const endStr = today.toISOString().split('T')[0]

  const { count: punchIns } = await supabase
    .from('consist_logs')
    .select('*', { count: 'exact', head: true })
    .in('user_id', memberIds)
    .gte('date', startStr)
    .lte('date', endStr)

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
}
