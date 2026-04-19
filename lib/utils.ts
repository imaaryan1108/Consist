import { Database } from '@/types/database.types'

type ConsistLog = Database['public']['Tables']['consist_logs']['Row']

// ─── Date helpers (all local-time, no UTC shifting) ───────────────────────────

// Parse a YYYY-MM-DD string into a LOCAL Date object.
// Using `new Date('YYYY-MM-DD')` parses as UTC midnight which shifts the date
// in non-UTC timezones. The multi-arg constructor avoids that entirely.
function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Format a Date to YYYY-MM-DD using local time (not UTC)
function localDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Number of calendar days from `earlier` to `later` (positive = later is ahead)
export function daysBetween(earlier: string, later: string): number {
  const a = parseDateLocal(earlier)
  const b = parseDateLocal(later)
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

// Return the date string for the day before `dateStr`
function previousDay(dateStr: string): string {
  const d = parseDateLocal(dateStr)
  d.setDate(d.getDate() - 1)
  return localDateString(d)
}

// ─── Public date utilities ────────────────────────────────────────────────────

/**
 * Today's date in YYYY-MM-DD using the device's LOCAL timezone.
 * Previously used toISOString() which is UTC and shifts the date for UTC+ users.
 */
export function getTodayDate(): string {
  return localDateString(new Date())
}

export function isToday(date: string): boolean {
  return date === getTodayDate()
}

export function isYesterday(date: string): boolean {
  return date === previousDay(getTodayDate())
}

// ─── Streak calculation ───────────────────────────────────────────────────────

/**
 * Calculate the current streak from a list of consist logs.
 *
 * Rule: a streak breaks only if the user misses TWO consecutive days.
 * Missing one day is a grace period — the streak continues.
 *
 * Gap logic (gap = how many days the log is behind the expected date):
 *   gap === 0  → matched expected day, streak++, step expected back 1
 *   gap === 1  → exactly 1 day missed (grace period), streak++, step expected
 *                back to the day before this log
 *   gap >= 2   → 2+ consecutive days missed, streak is broken, stop
 *
 * @param logs  - Consist logs (any order, duplicates OK)
 * @param today - Today's date string (YYYY-MM-DD, local time)
 */
export function calculateStreak(
  logs: ConsistLog[],
  today: string
): {
  currentStreak: number
  isNewRecord: boolean
} {
  if (!logs || logs.length === 0) {
    return { currentStreak: 0, isNewRecord: false }
  }

  // Deduplicate and sort newest → oldest
  const sortedDates = [...new Set(logs.map(l => l.date))].sort((a, b) =>
    b.localeCompare(a)
  )

  let streak = 0
  let expected = today

  for (const logDate of sortedDates) {
    const gap = daysBetween(logDate, expected) // positive = logDate is behind expected

    if (gap === 0) {
      // Matched expected day exactly
      streak++
      expected = previousDay(expected)
    } else if (gap === 1) {
      // Exactly 1 day missed — grace period, streak continues
      streak++
      expected = previousDay(logDate)
    } else {
      // 2+ consecutive days missed — streak broken
      break
    }
  }

  return { currentStreak: streak, isNewRecord: false }
}

/**
 * Client-side helper to show the correct streak on the dashboard.
 *
 * The `current_streak` column is only updated on punch-in, so if a user
 * missed 2+ days it stays stale until next punch-in. This function returns
 * 0 when it detects the DB value is stale.
 *
 * With the 2-day grace period rule:
 *   - Last consist today or yesterday         → streak valid
 *   - Last consist 2 days ago (1 day missed)  → streak valid (grace period)
 *   - Last consist 3+ days ago (2+ days missed) → streak is 0
 */
export function getDisplayStreak(
  currentStreak: number,
  lastConsistDate: string | null
): number {
  if (!lastConsistDate || currentStreak === 0) return currentStreak
  const daysSinceLast = daysBetween(lastConsistDate, getTodayDate())
  return daysSinceLast >= 3 ? 0 : currentStreak
}

// ─── Points calculation ───────────────────────────────────────────────────────

export function calculateConsistPoints(
  wasPushed: boolean,
  newStreak: number,
  longestStreak: number
): {
  basePoints: number
  pushBonus: number
  streakBonus: number
  total: number
  isNewRecord: boolean
} {
  const basePoints = 100
  const pushBonus = wasPushed ? 5 : 0
  let streakBonus = 0
  let isNewRecord = false

  if (newStreak === 7) {
    streakBonus = 300
  }

  if (newStreak > longestStreak) {
    streakBonus += 500
    isNewRecord = true
  }

  return {
    basePoints,
    pushBonus,
    streakBonus,
    total: basePoints + pushBonus + streakBonus,
    isNewRecord,
  }
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function formatStreakText(streak: number): string {
  if (streak === 0) return 'No streak yet'
  if (streak === 1) return '1 day'
  return `${streak} days`
}

export function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Start your consistency journey! 🎯'
  if (streak === 1) return 'First step taken! Keep going 🚀'
  if (streak === 3) return 'Building momentum! 💪'
  if (streak === 7) return 'One week strong! You\'re unstoppable! 🔥'
  if (streak === 14) return 'Two weeks! This is becoming a habit 🌟'
  if (streak === 30) return '30 days! You\'re an inspiration! 👑'
  if (streak >= 100) return '100+ days! Legendary consistency! 🏆'
  return `${streak} days and counting! 🔥`
}

export function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return then.toLocaleDateString()
}
