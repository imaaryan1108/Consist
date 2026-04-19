'use server'

import { createServerClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'
import { getBodyProfile } from './body-profile'

type WeeklyCheckin = Database['public']['Tables']['weekly_checkins']['Row']
type WeeklyCheckinInsert = Database['public']['Tables']['weekly_checkins']['Insert']
type BodyProfileUpdate = Database['public']['Tables']['body_profiles']['Update']

/**
 * Format a Date to YYYY-MM-DD using LOCAL time (not UTC)
 */
function localDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Get the start of the current week (Monday) in local time
 */
function getWeekStartDate(date: Date = new Date()): string {
  const day = date.getDay() // local day-of-week (0=Sun, 1=Mon…)
  const diff = day === 0 ? -6 : 1 - day // days back to Monday
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  return localDateString(monday)
}

/**
 * Submit a weekly check-in
 */
export async function submitWeeklyCheckin(checkinData: {
  weight_kg: number
  waist_cm?: number
  chest_cm?: number
  arms_cm?: number
}) {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return { success: false, message: 'Not authenticated' }
    }
    
    const userId = session.user.id
    const week_start_date = getWeekStartDate()
    
    // Get previous week's check-in for comparison
    const history = await getWeeklyCheckinHistory(2)
    const previousCheckin = history.length > 0 ? history[0] : null
    
    const weight_change_kg = previousCheckin 
      ? checkinData.weight_kg - previousCheckin.weight_kg 
      : null
    
    const insert: WeeklyCheckinInsert = {
      user_id: userId,
      week_start_date,
      weight_kg: checkinData.weight_kg,
      waist_cm: checkinData.waist_cm,
      chest_cm: checkinData.chest_cm,
      arms_cm: checkinData.arms_cm,
      weight_change_kg
    }
    
    // Check if check-in already exists for this week
    const { data: existing } = await supabase
      .from('weekly_checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start_date', week_start_date)
      .single()
    
    if (existing) {
      // Update existing check-in
      const { error: updateError } = await supabase
        .from('weekly_checkins')
        .update(insert)
        .eq('user_id', userId)
        .eq('week_start_date', week_start_date)
      
      if (updateError) throw updateError
    } else {
      // Insert new check-in
      const { error: insertError } = await supabase
        .from('weekly_checkins')
        .insert(insert)
      
      if (insertError) throw insertError
    }
    
    // Update body profile with new current weight (keep existing height)
    const bodyProfile = await getBodyProfile()
    if (bodyProfile) {
      const updateData: BodyProfileUpdate = {
        current_weight_kg: checkinData.weight_kg,
        updated_at: new Date().toISOString()
      }
      
      // Only update measurements if provided
      if (checkinData.waist_cm !== undefined) updateData.waist_cm = checkinData.waist_cm
      if (checkinData.chest_cm !== undefined) updateData.chest_cm = checkinData.chest_cm
      if (checkinData.arms_cm !== undefined) updateData.arms_cm = checkinData.arms_cm
      
      const { error: profileUpdateError } = await supabase
        .from('body_profiles')
        .update(updateData)
        .eq('user_id', userId)
      
      if (profileUpdateError) {
        console.error('Failed to update body profile:', profileUpdateError)
      }
    }
    
    return { 
      success: true, 
      message: 'Weekly check-in submitted successfully',
      weight_change_kg 
    }
  } catch (error: any) {
    console.error('Error submitting weekly check-in:', error)
    return { success: false, message: error.message || 'Failed to submit check-in' }
  }
}

/**
 * Get weekly check-in history
 */
export async function getWeeklyCheckinHistory(limit: number = 12): Promise<WeeklyCheckin[]> {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('Not authenticated')
      return []
    }
    
    const userId = session.user.id
    
    const { data, error } = await supabase
      .from('weekly_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('week_start_date', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return data || []
  } catch (error: any) {
    console.error('Error fetching weekly check-in history:', error)
    return []
  }
}

/**
 * Check if user should be prompted for weekly check-in.
 * Only prompts on Sundays, and only if no check-in has been submitted this week.
 */
export async function shouldPromptWeeklyCheckin(): Promise<boolean> {
  // Only show on Sunday (local day = 0)
  const today = new Date()
  if (today.getDay() !== 0) return false

  const supabase = await createServerClient()

  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) return false

    const userId = session.user.id
    const week_start_date = getWeekStartDate()

    const { data } = await supabase
      .from('weekly_checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start_date', week_start_date)
      .single()

    // Only prompt if they haven't submitted this week's check-in yet
    return !data
  } catch {
    return false
  }
}

/**
 * Get the most recent weekly check-in
 */
export async function getLatestWeeklyCheckin(): Promise<WeeklyCheckin | null> {
  const history = await getWeeklyCheckinHistory(1)
  return history.length > 0 ? history[0] : null
}
