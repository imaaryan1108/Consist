'use server'

import { createServerClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'
import { getTodayDate } from '@/lib/utils'
import { notifyCircleMembers } from '@/lib/utils/push-server'

type MealLog = Database['public']['Tables']['meal_logs']['Row']
type MealLogInsert = Database['public']['Tables']['meal_logs']['Insert']

export interface DailySummary {
  date: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fats: number
  total_water: number
  meal_count: number
  meals: MealLog[]
}

/**
 * Log a meal
 */
export async function logMeal(mealData: {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  food_name: string
  calories: number
  protein_g?: number
  carbs_g?: number
  fats_g?: number
  water_ml?: number
  date?: string
}) {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return { success: false, message: 'Not authenticated' }
    }
    
    const userId = session.user.id
    const date = mealData.date || getTodayDate()
    
    const insert: MealLogInsert = {
      user_id: userId,
      date,
      meal_type: mealData.meal_type,
      food_name: mealData.food_name,
      calories: mealData.calories,
      protein_g: mealData.protein_g,
      carbs_g: mealData.carbs_g,
      fats_g: mealData.fats_g,
      water_ml: mealData.water_ml
    }
    
    const { error: insertError } = await supabase
      .from('meal_logs')
      .insert(insert)

    if (insertError) throw insertError

    // Notify circle members with FOMO-inducing message
    const { data: user } = await supabase
      .from('users')
      .select('name, circle_id')
      .eq('id', userId)
      .single()

    if (user?.circle_id) {
      const mealLabels: Record<string, string> = {
        breakfast: 'breakfast 🍳',
        lunch: 'lunch 🥗',
        dinner: 'dinner 🍽️',
        snack: 'a snack 🍎',
      }
      const mealLabel = mealLabels[mealData.meal_type] || mealData.meal_type

      const fomoMessages: Record<string, string> = {
        breakfast: `${user.name} logged breakfast. FOMO loading... log yours before they lap you.`,
        lunch: `${user.name} is tracking lunch. Your macros are watching.`,
        dinner: `${user.name} closed out their day strong. Have you?`,
        snack: `${user.name} logged a snack. Every calorie counts — are you counting?`,
      }

      await notifyCircleMembers({
        circleId: user.circle_id,
        excludeUserId: userId,
        title: `${user.name} logged ${mealLabel}`,
        body: fomoMessages[mealData.meal_type] || `${user.name} logged ${mealLabel}. Keep up.`,
        url: '/tracking',
      })
    }

    return { success: true, message: 'Meal logged successfully' }
  } catch (error: any) {
    console.error('Error logging meal:', error)
    return { success: false, message: error.message || 'Failed to log meal' }
  }
}

/**
 * Get meals for a specific date
 */
export async function getMealsForDate(date?: string): Promise<MealLog[]> {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('Not authenticated')
      return []
    }
    
    const userId = session.user.id
    const targetDate = date || getTodayDate()
    
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', targetDate)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    return data || []
  } catch (error: any) {
    console.error('Error fetching meals:', error)
    return []
  }
}

/**
 * Get daily summary with totals
 */
export async function getDailySummary(date?: string): Promise<DailySummary> {
  const targetDate = date || getTodayDate()
  const meals = await getMealsForDate(targetDate)
  
  const total_calories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0)
  const total_protein = meals.reduce((sum, meal) => sum + (meal.protein_g || 0), 0)
  const total_carbs = meals.reduce((sum, meal) => sum + (meal.carbs_g || 0), 0)
  const total_fats = meals.reduce((sum, meal) => sum + (meal.fats_g || 0), 0)
  const total_water = meals.reduce((sum, meal) => sum + (meal.water_ml || 0), 0)
  
  return {
    date: targetDate,
    total_calories,
    total_protein,
    total_carbs,
    total_fats,
    total_water,
    meal_count: meals.length,
    meals
  }
}

/**
 * Delete a meal
 */
export async function deleteMeal(mealId: string) {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return { success: false, message: 'Not authenticated' }
    }
    
    const userId = session.user.id
    
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', mealId)
      .eq('user_id', userId) // Ensure user owns this meal
    
    if (error) throw error
    
    return { success: true, message: 'Meal deleted successfully' }
  } catch (error: any) {
    console.error('Error deleting meal:', error)
    return { success: false, message: error.message || 'Failed to delete meal' }
  }
}

/**
 * Update a meal
 */
export async function updateMeal(
  mealId: string,
  updates: {
    food_name?: string
    calories?: number
    protein_g?: number
    carbs_g?: number
    fats_g?: number
    water_ml?: number
  }
) {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return { success: false, message: 'Not authenticated' }
    }
    
    const userId = session.user.id
    
    const { error } = await supabase
      .from('meal_logs')
      .update(updates)
      .eq('id', mealId)
      .eq('user_id', userId) // Ensure user owns this meal
    
    if (error) throw error
    
    return { success: true, message: 'Meal updated successfully' }
  } catch (error: any) {
    console.error('Error updating meal:', error)
    return { success: false, message: error.message || 'Failed to update meal' }
  }
}
