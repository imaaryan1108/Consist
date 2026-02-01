'use server'

import { createServerClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'
import { getTargetProgress } from './targets'
import { getBodyProfile } from './body-profile'

type Milestone = Database['public']['Tables']['milestones']['Row']
type MilestoneInsert = Database['public']['Tables']['milestones']['Insert']

/**
 * Check and create milestones based on user progress
 */
export async function checkAndCreateMilestones() {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return { success: false, milestones: [] }
    }
    
    const userId = session.user.id
    const newMilestones: Milestone[] = []
    
    // Check for weight milestones
    const weightMilestone = await checkWeightMilestone(userId)
    if (weightMilestone) {
      newMilestones.push(weightMilestone)
    }
    
    // Check for weekly consistency milestone (7-day streak)
    const weeklyMilestone = await checkWeeklyConsistency(userId)
    if (weeklyMilestone) {
      newMilestones.push(weeklyMilestone)
    }
    
    // Check for monthly consistency milestone (30-day streak)
    const monthlyMilestone = await checkMonthlyConsistency(userId)
    if (monthlyMilestone) {
      newMilestones.push(monthlyMilestone)
    }
    
    // Check if target achieved
    const targetMilestone = await checkTargetAchieved(userId)
    if (targetMilestone) {
      newMilestones.push(targetMilestone)
    }
    
    return { success: true, milestones: newMilestones }
  } catch (error: any) {
    console.error('Error checking milestones:', error)
    return { success: false, milestones: [] }
  }
}

/**
 * Check for weight milestone (every 2kg lost)
 */
async function checkWeightMilestone(userId: string): Promise<Milestone | null> {
  const supabase = await createServerClient()
  
  try {
    const targetProgress = await getTargetProgress()
    if (!targetProgress || targetProgress.kg_progress <= 0) return null
    
    // Calculate milestone thresholds (every 2kg)
    const totalKgLost = targetProgress.kg_progress
    const milestoneThreshold = Math.floor(totalKgLost / 2) * 2
    
    if (milestoneThreshold < 2) return null // Need at least 2kg lost
    
    // Check if we already have this milestone
    const { data: existing } = await supabase
      .from('milestones')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'weight_milestone')
      .filter('metadata->>kg_lost', 'eq', milestoneThreshold.toString())
      .single()
    
    if (existing) return null // Already achieved
    
    // Create milestone
    const bonusPoints = milestoneThreshold * 5 // 5 points per kg
    const insert: MilestoneInsert = {
      user_id: userId,
      type: 'weight_milestone',
      title: `${milestoneThreshold}kg Down!`,
      description: `You've lost ${milestoneThreshold}kg towards your goal`,
      icon: '🏆',
      bonus_points: bonusPoints,
      metadata: {
        kg_lost: milestoneThreshold
      }
    }
    
    const { data, error } = await supabase
      .from('milestones')
      .insert(insert)
      .select()
      .single()
    
    if (error) throw error
    
    // Award bonus points to user
    await supabase.rpc('increment_user_score', { 
      user_id: userId, 
      points: bonusPoints 
    })
    
    return data
  } catch (error: any) {
    console.error('Error checking weight milestone:', error)
    return null
  }
}

/**
 * Check for weekly consistency (7-day streak)
 */
async function checkWeeklyConsistency(userId: string): Promise<Milestone | null> {
  const supabase = await createServerClient()
  
  try {
    // Get user's current streak
    const { data: user } = await supabase
      .from('users')
      .select('current_streak')
      .eq('id', userId)
      .single()
    
    if (!user || user.current_streak !== 7) return null
    
    // Check if we already have this milestone for this streak
    const { data: existing } = await supabase
      .from('milestones')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'weekly_completion')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .single()
    
    if (existing) return null // Already achieved recently
    
    const insert: MilestoneInsert = {
      user_id: userId,
      type: 'weekly_completion',
      title: '7-Day Streak!',
      description: 'Completed a full week of consistency',
      icon: '🔥',
      bonus_points: 20,
      metadata: {
        streak: 7
      }
    }
    
    const { data, error } = await supabase
      .from('milestones')
      .insert(insert)
      .select()
      .single()
    
    if (error) throw error
    
    // Award bonus points
    await supabase.rpc('increment_user_score', { 
      user_id: userId, 
      points: 20 
    })
    
    return data
  } catch (error: any) {
    console.error('Error checking weekly consistency:', error)
    return null
  }
}

/**
 * Check for monthly consistency (30-day streak)
 */
async function checkMonthlyConsistency(userId: string): Promise<Milestone | null> {
  const supabase = await createServerClient()
  
  try {
    const { data: user } = await supabase
      .from('users')
      .select('current_streak')
      .eq('id', userId)
      .single()
    
    if (!user || user.current_streak !== 30) return null
    
    // Check if we already have this milestone for this streak
    const { data: existing } = await supabase
      .from('milestones')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'monthly_consistency')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .single()
    
    if (existing) return null
    
    const insert: MilestoneInsert = {
      user_id: userId,
      type: 'monthly_consistency',
      title: '30-Day Elite!',
      description: 'Maintained consistency for a full month',
      icon: '👑',
      bonus_points: 100,
      metadata: {
        streak: 30
      }
    }
    
    const { data, error } = await supabase
      .from('milestones')
      .insert(insert)
      .select()
      .single()
    
    if (error) throw error
    
    await supabase.rpc('increment_user_score', { 
      user_id: userId, 
      points: 100 
    })
    
    return data
  } catch (error: any) {
    console.error('Error checking monthly consistency:', error)
    return null
  }
}

/**
 * Check if target achieved
 */
async function checkTargetAchieved(userId: string): Promise<Milestone | null> {
  const supabase = await createServerClient()
  
  try {
    const targetProgress = await getTargetProgress()
    if (!targetProgress) return null
    
    // Check if target is achieved (current weight <= target weight)
    if (targetProgress.current_weight_kg > targetProgress.target_weight_kg) {
      return null
    }
    
    // Check if we already have this milestone
    const { data: existing } = await supabase
      .from('milestones')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'target_achieved')
      .single()
    
    if (existing) return null
    
    const insert: MilestoneInsert = {
      user_id: userId,
      type: 'target_achieved',
      title: 'Target Achieved! 🎉',
      description: `Reached ${targetProgress.target_weight_kg}kg goal!`,
      icon: '🎯',
      bonus_points: 500,
      metadata: {
        target_weight: targetProgress.target_weight_kg,
        starting_weight: targetProgress.starting_weight_kg,
        total_lost: targetProgress.kg_progress
      }
    }
    
    const { data, error } = await supabase
      .from('milestones')
      .insert(insert)
      .select()
      .single()
    
    if (error) throw error
    
    await supabase.rpc('increment_user_score', { 
      user_id: userId, 
      points: 500 
    })
    
    return data
  } catch (error: any) {
    console.error('Error checking target achieved:', error)
    return null
  }
}

/**
 * Get user's milestones
 */
export async function getUserMilestones(limit: number = 10): Promise<Milestone[]> {
  const supabase = await createServerClient()
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('Not authenticated')
      return []
    }
    
    const userId = session.user.id
    
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return data || []
  } catch (error: any) {
    console.error('Error fetching milestones:', error)
    return []
  }
}
