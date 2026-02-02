/**
 * Date utility functions for week calculations
 */

/**
 * Get start and end dates for current week (Mon-Sun)
 */
export function getCurrentWeekDates(): { startDate: string; endDate: string } {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, ...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust to get Monday
  
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  
  return {
    startDate: monday.toISOString().split('T')[0],
    endDate: sunday.toISOString().split('T')[0]
  }
}

/**
 * Get week dates with offset (negative = past weeks, positive = future weeks)
 */
export function getWeekDatesWithOffset(offset: number): { startDate: string; endDate: string } {
  const { startDate, endDate } = getCurrentWeekDates()
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Adjust by offset weeks
  start.setDate(start.getDate() + (offset * 7))
  end.setDate(end.getDate() + (offset * 7))
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  }
}
