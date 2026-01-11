import { Database } from '@/types/database.types'

type ConsistLog = Database['public']['Tables']['consist_logs']['Row']

/**
 * Calculate user's current streak based on consist logs
 * 
 * @param logs - Array of consist logs sorted by date DESC
 * @param today - Today's date string (YYYY-MM-DD)
 * @returns Object with current streak count and whether it's a new record
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

  // Convert dates to date objects for comparison
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  let streak = 0
  let currentDate = new Date(today)
  
  for (const log of sortedLogs) {
    const logDate = new Date(log.date)
    const dateString = logDate.toISOString().split('T')[0]
    const expectedDate = currentDate.toISOString().split('T')[0]
    
    if (dateString === expectedDate) {
      streak++
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      // Gap in streak, stop counting
      break
    }
  }

  return {
    currentStreak: streak,
    isNewRecord: false // Caller should compare with longest_streak
  }
}

/**
 * Calculate points for a consist action
 */
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

  // 7-day streak milestone
  if (newStreak === 7) {
    streakBonus = 300
  }

  // New personal record
  if (newStreak > longestStreak) {
    streakBonus += 500
    isNewRecord = true
  }

  return {
    basePoints,
    pushBonus,
    streakBonus,
    total: basePoints + pushBonus + streakBonus,
    isNewRecord
  }
}

/**
 * Format streak display text
 */
export function formatStreakText(streak: number): string {
  if (streak === 0) return 'No streak yet'
  if (streak === 1) return '1 day'
  return `${streak} days`
}

/**
 * Get motivational message based on streak
 */
export function getStreakMessage(streak: number): string {
  if (streak === 0) return "Start your consistency journey! 🎯"
  if (streak === 1) return "First step taken! Keep going 🚀"
  if (streak === 3) return "Building momentum! 💪"
  if (streak === 7) return "One week strong! You're unstoppable! 🔥"
  if (streak === 14) return "Two weeks! This is becoming a habit 🌟"
  if (streak === 30) return "30 days! You're an inspiration! 👑"
  if (streak >= 100) return "100+ days! Legendary consistency! 🏆"
  
  return `${streak} days and counting! 🔥`
}

/**
 * Check if a date is today
 */
export function isToday(date: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return date === today
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: string): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayString = yesterday.toISOString().split('T')[0]
  return date === yesterdayString
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Format relative time (e.g., "2 hours ago", "just now")
 */
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
