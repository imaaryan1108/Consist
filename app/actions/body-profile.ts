'use server'

import { createServerClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type BodyProfile = Database['public']['Tables']['body_profiles']['Row']
type BodyProfileInsert = Database['public']['Tables']['body_profiles']['Insert']
type BodyProfileUpdate = Database['public']['Tables']['body_profiles']['Update']

/**
 * Get the current user's body profile
 */
export async function getBodyProfile(): Promise<BodyProfile | null> {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('Not authenticated')
      return null
    }
    
    const userId = session.user.id
    
    const { data, error } = await supabase
      .from('body_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No profile exists yet
        return null
      }
      throw error
    }
    
    return data
  } catch (error: any) {
    console.error('Error fetching body profile:', error)
    return null
  }
}

/**
 * Create or update body profile
 */
export async function upsertBodyProfile(profileData: {
  height_cm: number
  current_weight_kg: number
  waist_cm?: number
  chest_cm?: number
  arms_cm?: number
  unit_preference?: 'metric' | 'imperial'
}) {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return { success: false, message: 'Not authenticated' }
    }
    
    const userId = session.user.id
    
    // Check if profile exists
    const existing = await getBodyProfile()
    
    if (existing) {
      // Update existing profile
      const updates: BodyProfileUpdate = {
        ...profileData,
        updated_at: new Date().toISOString()
      }
      
      const { error: updateError } = await supabase
        .from('body_profiles')
        .update(updates)
        .eq('user_id', userId)
      
      if (updateError) throw updateError
      
      return { success: true, message: 'Profile updated successfully' }
    } else {
      // Create new profile
      const insert: BodyProfileInsert = {
        user_id: userId,
        ...profileData
      }
      
      const { error: insertError } = await supabase
        .from('body_profiles')
        .insert(insert)
      
      if (insertError) throw insertError
      
      return { success: true, message: 'Profile created successfully' }
    }
  } catch (error: any) {
    console.error('Error upserting body profile:', error)
    return { success: false, message: error.message || 'Failed to save profile' }
  }
}
