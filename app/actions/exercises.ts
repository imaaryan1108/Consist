'use server'

import { createServerClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type ExerciseLog = Database['public']['Tables']['exercise_logs']['Row']
type ExerciseLogInsert = Database['public']['Tables']['exercise_logs']['Insert']
type ExerciseLogUpdate = Database['public']['Tables']['exercise_logs']['Update']

/**
 * Log a single exercise
 */
export async function logExercise(exerciseData: {
  workout_log_id: string
  exercise_name: string
  sets: number
  reps: number
  weight_kg?: number
  rest_seconds?: number
  notes?: string
}) {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return { success: false, message: 'Not authenticated' }
    }
    
    const userId = session.user.id
    
    const insert: ExerciseLogInsert = {
      user_id: userId,
      ...exerciseData
    }
    
    const { error } = await supabase
      .from('exercise_logs')
      .insert(insert)
    
    if (error) throw error
    
    return { success: true, message: 'Exercise logged successfully' }
  } catch (error: any) {
    console.error('Error logging exercise:', error)
    return { success: false, message: error.message || 'Failed to log exercise' }
  }
}

/**
 * Get all exercises for a specific workout
 */
export async function getWorkoutExercises(workoutLogId: string): Promise<ExerciseLog[]> {
  const supabase = await createServerClient()
  
  try {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('workout_log_id', workoutLogId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    return data || []
  } catch (error: any) {
    console.error('Error fetching workout exercises:', error)
    return []
  }
}

/**
 * Get exercise history for a specific exercise name
 * (useful for showing "last time" comparisons)
 */
export async function getExerciseHistory(exerciseName: string, limit: number = 10): Promise<ExerciseLog[]> {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return []
    }
    
    const userId = session.user.id
    
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', userId)
      .ilike('exercise_name', exerciseName)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return data || []
  } catch (error: any) {
    console.error('Error fetching exercise history:', error)
    return []
  }
}

/**
 * Delete an exercise log
 */
export async function deleteExercise(exerciseId: string) {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return { success: false, message: 'Not authenticated' }
    }
    
    const { error } = await supabase
      .from('exercise_logs')
      .delete()
      .eq('id', exerciseId)
    
    if (error) throw error
    
    return { success: true, message: 'Exercise deleted successfully' }
  } catch (error: any) {
    console.error('Error deleting exercise:', error)
    return { success: false, message: error.message || 'Failed to delete exercise' }
  }
}

/**
 * Update an exercise log
 */
export async function updateExercise(exerciseId: string, updates: {
  exercise_name?: string
  sets?: number
  reps?: number
  weight_kg?: number
  rest_seconds?: number
  notes?: string
}) {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return { success: false, message: 'Not authenticated' }
    }
    
    const { error } = await supabase
      .from('exercise_logs')
      .update(updates)
      .eq('id', exerciseId)
    
    if (error) throw error
    
    return { success: true, message: 'Exercise updated successfully' }
  } catch (error: any) {
    console.error('Error updating exercise:', error)
    return { success: false, message: error.message || 'Failed to update exercise' }
  }
}

/**
 * Get all workouts with their exercises (for history view)
 */
export async function getWorkoutHistory(limit: number = 30) {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return []
    }
    
    const userId = session.user.id
    
    // Get workouts
    const { data: workouts, error: workoutsError } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)
    
    if (workoutsError) throw workoutsError
    
    if (!workouts || workouts.length === 0) return []
    
    // Get all exercises for these workouts
    const workoutIds = workouts.map(w => w.id)
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercise_logs')
      .select('*')
      .in('workout_log_id', workoutIds)
      .order('created_at', { ascending: true })
    
    if (exercisesError) throw exercisesError
    
    // Combine workouts with their exercises
    return workouts.map(workout => ({
      ...workout,
      exercises: exercises?.filter(ex => ex.workout_log_id === workout.id) || []
    }))
  } catch (error: any) {
    console.error('Error fetching workout history:', error)
    return []
  }
}
