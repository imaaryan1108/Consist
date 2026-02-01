'use server'

import { createServerClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'
import { getTodayDate } from '@/lib/utils'

type WorkoutLog = Database['public']['Tables']['workout_logs']['Row']
type WorkoutLogInsert = Database['public']['Tables']['workout_logs']['Insert']
type WorkoutLogUpdate = Database['public']['Tables']['workout_logs']['Update']

/**
 * Log a workout (one per day, replaces existing)
 */
export async function logWorkout(workoutData: {
  workout_type: 'gym' | 'walk' | 'cardio' | 'rest' | 'other'
  duration_minutes?: number
  muscle_group?: string
  notes?: string
  date?: string
}) {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return { success: false, message: 'Not authenticated' }
    }
    
    const userId = session.user.id
    const date = workoutData.date || getTodayDate()
    
    // Check if workout already exists for this date
    const existing = await getWorkoutForDate(date)
    
    if (existing) {
      // Update existing workout
      const updates: WorkoutLogUpdate = {
        workout_type: workoutData.workout_type,
        duration_minutes: workoutData.duration_minutes,
        muscle_group: workoutData.muscle_group,
        notes: workoutData.notes
      }
      
      const { error: updateError } = await supabase
        .from('workout_logs')
        .update(updates)
        .eq('user_id', userId)
        .eq('date', date)
      
      if (updateError) throw updateError
      
      return { 
        success: true, 
        message: 'Workout updated successfully',
        workout_id: existing.id
      }
    } else {
      // Insert new workout
      const insert: WorkoutLogInsert = {
        user_id: userId,
        date,
        workout_type: workoutData.workout_type,
        duration_minutes: workoutData.duration_minutes,
        muscle_group: workoutData.muscle_group,
        notes: workoutData.notes
      }
      
      const { data, error: insertError } = await supabase
        .from('workout_logs')
        .insert(insert)
        .select()
        .single()
      
      if (insertError) throw insertError
      
      return { 
        success: true, 
        message: 'Workout logged successfully',
        workout_id: data.id
      }
    }
  } catch (error: any) {
    console.error('Error logging workout:', error)
    return { success: false, message: error.message || 'Failed to log workout' }
  }
}

/**
 * Get workout for a specific date
 */
export async function getWorkoutForDate(date?: string): Promise<WorkoutLog | null> {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('Not authenticated')
      return null
    }
    
    const userId = session.user.id
    const targetDate = date || getTodayDate()
    
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', targetDate)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No workout for this date
        return null
      }
      throw error
    }
    
    return data
  } catch (error: any) {
    console.error('Error fetching workout:', error)
    return null
  }
}

/**
 * Get workout history (most recent first)
 */
export async function getWorkoutHistory(limit: number = 30): Promise<WorkoutLog[]> {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('Not authenticated')
      return []
    }
    
    const userId = session.user.id
    
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return data || []
  } catch (error: any) {
    console.error('Error fetching workout history:', error)
    return []
  }
}

/**
 * Delete a workout
 */
export async function deleteWorkout(date: string) {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return { success: false, message: 'Not authenticated' }
    }
    
    const userId = session.user.id
    
    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)
    
    if (error) throw error
    
    return { success: true, message: 'Workout deleted successfully' }
  } catch (error: any) {
    console.error('Error deleting workout:', error)
    return { success: false, message: error.message || 'Failed to delete workout' }
  }
}
