import { supabase } from './client'
import { Database } from '@/types/database.types'

type Circle = Database['public']['Tables']['circles']['Row']
type User = Database['public']['Tables']['users']['Row']
type ConsistLog = Database['public']['Tables']['consist_logs']['Row']
type Push = Database['public']['Tables']['pushes']['Row']
type Activity = Database['public']['Tables']['activities']['Row']

/**
 * Generate a unique 6-character circle code
 */
export async function generateCircleCode(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_circle_code')
  
  if (error) {
    console.error('Error generating circle code:', error)
    throw error
  }
  
  return data
}

/**
 * Create a new circle
 */
export async function createCircle(name: string, userId: string): Promise<Circle> {
  const code = await generateCircleCode()
  
  const { data, error } = await supabase
    .from('circles')
    .insert({
      name,
      code,
      created_by: userId,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating circle:', error)
    throw error
  }
  
  return data
}

/**
 * Join a circle by code
 */
export async function joinCircle(code: string): Promise<Circle | null> {
  const { data, error } = await supabase
    .rpc('get_circle_by_code', { lookup_code: code })
    .single()
  
  if (error) {
    console.error('Error finding circle:', error)
    return null
  }
  
  return data
}

/**
 * Get user's circle members
 */
export async function getCircleMembers(circleId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('circle_id', circleId)
    .order('current_streak', { ascending: false })
  
  if (error) {
    console.error('Error fetching circle members:', error)
    throw error
  }
  
  return data || []
}

/**
 * Check if user consisted today
 */
export async function hasConsistedToday(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('consist_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" which is fine
    console.error('Error checking consist status:', error)
    return false
  }
  
  return !!data
}

/**
 * Get count of pushes sent by user today
 */
export async function getPushCountToday(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  
  const { count, error } = await supabase
    .from('pushes')
    .select('*', { count: 'exact', head: true })
    .eq('from_user_id', userId)
    .eq('date', today)
  
  if (error) {
    console.error('Error counting pushes:', error)
    return 0
  }
  
  return count || 0
}

/**
 * Check if user was pushed today
 */
export async function wasPushedToday(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('pushes')
    .select('id')
    .eq('to_user_id', userId)
    .eq('date', today)
    .limit(1)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error checking push status:', error)
    return false
  }
  
  return !!data
}

/**
 * Get circle activity feed
 */
export async function getCircleActivities(
  circleId: string,
  limit: number = 50
): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      actor:actor_id(*),
      target:target_id(*)
    `)
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching activities:', error)
    throw error
  }
  
  return data || []
}

/**
 * Subscribe to circle member updates (real-time)
 */
export function subscribeToCircleMembers(
  circleId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`circle:${circleId}:members`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `circle_id=eq.${circleId}`,
      },
      callback
    )
    .subscribe()
}

/**
 * Subscribe to circle activity feed (real-time)
 */
export function subscribeToCircleActivities(
  circleId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`circle:${circleId}:activities`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activities',
        filter: `circle_id=eq.${circleId}`,
      },
      callback
    )
    .subscribe()
}
