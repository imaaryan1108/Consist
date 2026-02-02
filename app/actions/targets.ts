'use server'

import { createServerClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'
import { getBodyProfile } from './body-profile'

type Target = Database['public']['Tables']['targets']['Row']
type TargetInsert = Database['public']['Tables']['targets']['Insert']
type TargetUpdate = Database['public']['Tables']['targets']['Update']

export interface TargetProgress {
  target_weight_kg: number
  current_weight_kg: number
  starting_weight_kg: number
  target_date: string
  days_remaining: number
  kg_remaining: number
  kg_progress: number
  weekly_required_change: number
  progress_percentage: number
  is_on_track: boolean
}

/**
 * Get the current user's target
 */
export async function getTarget(): Promise<Target | null> {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('Not authenticated')
      return null
    }
    
    const userId = session.user.id
    
    const { data, error } = await supabase
      .from('targets')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No target exists yet
        return null
      }
      throw error
    }
    
    return data
  } catch (error: any) {
    console.error('Error fetching target:', error)
    return null
  }
}

/**
 * Set a new target (replaces existing)
 */
export async function setTarget(targetData: {
  target_weight_kg: number
  target_date: string
  custom_message?: string
  target_calories_daily?: number
  target_protein_g_daily?: number
  target_carbs_g_daily?: number
  target_fats_g_daily?: number
}) {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return { success: false, message: 'Not authenticated' }
    }
    
    const userId = session.user.id
    
    // Get current weight from body profile
    const bodyProfile = await getBodyProfile()
    if (!bodyProfile) {
      return { 
        success: false, 
        message: 'Please set up your body profile first' 
      }
    }
    
    const starting_weight_kg = bodyProfile.current_weight_kg
    
    // Check if target already exists
    const existing = await getTarget()
    
    if (existing) {
      // Update existing target
      const updates: TargetUpdate = {
        target_weight_kg: targetData.target_weight_kg,
        target_date: targetData.target_date,
        custom_message: targetData.custom_message,
        target_calories_daily: targetData.target_calories_daily,
        target_protein_g_daily: targetData.target_protein_g_daily,
        target_carbs_g_daily: targetData.target_carbs_g_daily,
        target_fats_g_daily: targetData.target_fats_g_daily,
        starting_weight_kg, // Update starting weight
        starting_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      }
      
      const { error: updateError } = await supabase
        .from('targets')
        .update(updates)
        .eq('user_id', userId)
      
      if (updateError) throw updateError
      
      return { success: true, message: 'Target updated successfully' }
    } else {
      // Create new target
      const insert: TargetInsert = {
        user_id: userId,
        target_weight_kg: targetData.target_weight_kg,
        target_date: targetData.target_date,
        starting_weight_kg,
        custom_message: targetData.custom_message,
        target_calories_daily: targetData.target_calories_daily,
        target_protein_g_daily: targetData.target_protein_g_daily,
        target_carbs_g_daily: targetData.target_carbs_g_daily,
        target_fats_g_daily: targetData.target_fats_g_daily
      }
      
      const { error: insertError } = await supabase
        .from('targets')
        .insert(insert)
      
      if (insertError) throw insertError
      
      return { success: true, message: 'Target set successfully' }
    }
  } catch (error: any) {
    console.error('Error setting target:', error)
    return { success: false, message: error.message || 'Failed to set target' }
  }
}

/**
 * Calculate target progress
 */
export async function getTargetProgress(): Promise<TargetProgress | null> {
  try {
    const target = await getTarget()
    if (!target) return null
    
    const bodyProfile = await getBodyProfile()
    if (!bodyProfile) return null
    
    const current_weight_kg = bodyProfile.current_weight_kg
    const target_weight_kg = target.target_weight_kg
    const starting_weight_kg = target.starting_weight_kg
    const target_date = new Date(target.target_date)
    const today = new Date()
    
    // Calculate days remaining
    const days_remaining = Math.ceil(
      (target_date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    // Calculate weight metrics
    const total_kg_to_lose = starting_weight_kg - target_weight_kg
    const kg_remaining = current_weight_kg - target_weight_kg
    const kg_progress = starting_weight_kg - current_weight_kg
    
    // Calculate weekly requirement (negative means weight loss)
    const weeks_remaining = days_remaining / 7
    const weekly_required_change = weeks_remaining > 0 
      ? kg_remaining / weeks_remaining 
      : 0
    
    // Calculate progress percentage
    const progress_percentage = total_kg_to_lose > 0 
      ? Math.min(100, Math.max(0, (kg_progress / total_kg_to_lose) * 100))
      : 0
    
    // Check if on track (simplified: are we ahead of or on schedule?)
    const expected_progress = total_kg_to_lose * 
      ((target_date.getTime() - today.getTime()) / 
       (target_date.getTime() - new Date(target.starting_date).getTime()))
    const is_on_track = kg_progress >= (total_kg_to_lose - expected_progress)
    
    return {
      target_weight_kg,
      current_weight_kg,
      starting_weight_kg,
      target_date: target.target_date,
      days_remaining,
      kg_remaining: Math.max(0, kg_remaining),
      kg_progress,
      weekly_required_change,
      progress_percentage,
      is_on_track
    }
  } catch (error: any) {
    console.error('Error calculating target progress:', error)
    return null
  }
}

/**
 * Clear/delete target
 */
export async function deleteTarget() {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return { success: false, message: 'Not authenticated' }
    }
    
    const userId = session.user.id
    
    const { error } = await supabase
      .from('targets')
      .delete()
      .eq('user_id', userId)
    
    if (error) throw error
    
    return { success: true, message: 'Target deleted successfully' }
  } catch (error: any) {
    console.error('Error deleting target:', error)
    return { success: false, message: error.message || 'Failed to delete target' }
  }
}
