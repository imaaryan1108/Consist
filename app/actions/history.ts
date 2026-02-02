'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getTodayDate } from '@/lib/utils'
import { getCurrentWeekDates } from '@/lib/utils/date'

export interface WeeklySummary {
  startDate: string
  endDate: string
  daysTracked: number
  totalCalories: number
  avgCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  totalWater: number
  mealCount: number
  workoutsCompleted: number
}

export interface DailySummary {
  date: string
  meals: number
  calories: number
  protein: number
  carbs: number
  fats: number
  water: number
  workouts: number
}

/**
 * Get weekly summary of meals and workouts
 */
export async function getWeeklySummary(startDate?: string, endDate?: string): Promise<WeeklySummary> {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('Not authenticated')
      return getEmptyWeeklySummary(startDate, endDate)
    }
    
    const userId = session.user.id
    
    // Use current week if dates not provided
    const weekDates = startDate && endDate 
      ? { startDate, endDate } 
      : getCurrentWeekDates()
    
    // Fetch meals for the week
    const { data: meals, error: mealsError } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', weekDates.startDate)
      .lte('date', weekDates.endDate)
    
    if (mealsError) throw mealsError
    
    // Fetch workouts for the week
    const { data: workouts, error: workoutsError } = await supabase
      .from('workout_logs')
      .select('date')
      .eq('user_id', userId)
      .gte('date', weekDates.startDate)
      .lte('date', weekDates.endDate)
    
    if (workoutsError) throw workoutsError
    
    // Calculate totals
    const totalCalories = meals?.reduce((sum, m) => sum + (m.calories || 0), 0) || 0
    const totalProtein = meals?.reduce((sum, m) => sum + (m.protein_g || 0), 0) || 0
    const totalCarbs = meals?.reduce((sum, m) => sum + (m.carbs_g || 0), 0) || 0
    const totalFats = meals?.reduce((sum, m) => sum + (m.fats_g || 0), 0) || 0
    const totalWater = meals?.reduce((sum, m) => sum + (m.water_ml || 0), 0) || 0
    
    // Calculate unique days tracked
    const uniqueDates = new Set(meals?.map(m => m.date) || [])
    const daysTracked = uniqueDates.size
    
    // Count unique workout days
    const uniqueWorkoutDates = new Set(workouts?.map(w => w.date) || [])
    const workoutsCompleted = uniqueWorkoutDates.size
    
    return {
      startDate: weekDates.startDate,
      endDate: weekDates.endDate,
      daysTracked,
      totalCalories,
      avgCalories: daysTracked > 0 ? totalCalories / daysTracked : 0,
      totalProtein,
      totalCarbs,
      totalFats,
      totalWater,
      mealCount: meals?.length || 0,
      workoutsCompleted
    }
  } catch (error: any) {
    console.error('Error fetching weekly summary:', error)
    return getEmptyWeeklySummary(startDate, endDate)
  }
}

/**
 * Get daily summaries for a week
 */
export async function getDailyLogsForWeek(startDate?: string, endDate?: string): Promise<DailySummary[]> {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('Not authenticated')
      return []
    }
    
    const userId = session.user.id
    
    // Use current week if dates not provided
    const weekDates = startDate && endDate 
      ? { startDate, endDate } 
      : getCurrentWeekDates()
    
    // Fetch meals
    const { data: meals, error: mealsError } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', weekDates.startDate)
      .lte('date', weekDates.endDate)
      .order('date', { ascending: false })
    
    if (mealsError) throw mealsError
    
    // Fetch workouts
    const { data: workouts, error: workoutsError } = await supabase
      .from('workout_logs')
      .select('date')
      .eq('user_id', userId)
      .gte('date', weekDates.startDate)
      .lte('date', weekDates.endDate)
    
    if (workoutsError) throw workoutsError
    
    // Group by date
    const dailyMap = new Map<string, DailySummary>()
    
    // Initialize all days in the week
    const currentDate = new Date(weekDates.startDate)
    const endDateObj = new Date(weekDates.endDate)
    
    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0]
      dailyMap.set(dateStr, {
        date: dateStr,
        meals: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        water: 0,
        workouts: 0
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Add meal data
    meals?.forEach(meal => {
      const summary = dailyMap.get(meal.date)
      if (summary) {
        summary.meals++
        summary.calories += meal.calories || 0
        summary.protein += meal.protein_g || 0
        summary.carbs += meal.carbs_g || 0
        summary.fats += meal.fats_g || 0
        summary.water += meal.water_ml || 0
      }
    })
    
    // Add workout data
    const workoutCounts = new Map<string, number>()
    workouts?.forEach(workout => {
      workoutCounts.set(workout.date, (workoutCounts.get(workout.date) || 0) + 1)
    })
    
    workoutCounts.forEach((count, date) => {
      const summary = dailyMap.get(date)
      if (summary) {
        summary.workouts = count
      }
    })
    
    // Convert to array and sort by date descending
    return Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date))
  } catch (error: any) {
    console.error('Error fetching daily logs:', error)
    return []
  }
}

function getEmptyWeeklySummary(startDate?: string, endDate?: string): WeeklySummary {
  const weekDates = startDate && endDate 
    ? { startDate, endDate } 
    : getCurrentWeekDates()
    
  return {
    startDate: weekDates.startDate,
    endDate: weekDates.endDate,
    daysTracked: 0,
    totalCalories: 0,
    avgCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    totalWater: 0,
    mealCount: 0,
    workoutsCompleted: 0
  }
}
