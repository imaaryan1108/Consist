'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateStreak, calculateConsistPoints, getTodayDate, isYesterday, getStreakMessage } from '@/lib/utils'
import { getTargetProgress } from './actions/targets'
import { checkAndCreateMilestones } from './actions/milestones'
import { shouldPromptWeeklyCheckin } from './actions/weekly-checkin'

export async function punchIn() {
  const supabase = await createServerClient()
  const today = getTodayDate()

  try {
    // 1. Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) throw new Error('Not authenticated')
    
    const userId = session.user.id

    // 2. Check if already consisted today
    const { data: existingLog } = await supabase
      .from('consist_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (existingLog) {
      return { success: false, message: 'Already consisted today!' }
    }

    // 3. Get user data for calculations
    const { data: userRaw, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    const user = userRaw as any

    if (userError || !user || !user.circle_id) throw new Error('User not found or no circle')

    // 4. Get logs for streak calculation (fetch last 365 days to be safe)
    const { data: logs } = await supabase
      .from('consist_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(365)

    // 5. Check if was pushed today
    const { data: pushesRaw } = await supabase
      .from('pushes')
      .select('id, from_user_id')
      .eq('to_user_id', userId)
      .eq('date', today)

    const pushes = pushesRaw as any[]
    const wasPushed = !!(pushes && pushes.length > 0)

    // 6. Calculate new stats
    // We append a fake log for today to calculate what the streak WOULD be
    const currentLogs = logs || []
    
    const mockTodayLog = { 
      id: 'temp', 
      user_id: userId, 
      date: today, 
      created_at: new Date().toISOString() 
    }
    const updatedLogs = [mockTodayLog, ...currentLogs]
    
    const { currentStreak } = calculateStreak(updatedLogs, today)
    
    const points = calculateConsistPoints(
      wasPushed,
      currentStreak,
      user.longest_streak || 0
    )

    // 7. Insert Consist Log
    const { error: logError } = await supabase
      .from('consist_logs')
      .insert({
        user_id: userId,
        date: today
      })

    if (logError) throw logError

    // 8. Update User Stats
    const updates: any = {
      current_streak: currentStreak,
      total_days: (user.total_days || 0) + 1,
      score: (user.score || 0) + points.total,
      last_consist_date: today,
      updated_at: new Date().toISOString()
    }

    if (points.isNewRecord) {
      updates.longest_streak = currentStreak
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)

    if (updateError) throw updateError

    // 9. Create Activity Feed Item
    const activityType = points.isNewRecord ? 'streak_milestone' : 
                         wasPushed ? 'consisted_after_push' : 'consisted'

    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        circle_id: user.circle_id,
        actor_id: userId,
        type: activityType,
        metadata: {
          streak: currentStreak,
          points: points.total,
          message: getStreakMessage(currentStreak),
          was_new_record: points.isNewRecord
        }
      })

    if (activityError) {
      console.error('Failed to create activity', activityError)
      // Don't fail the request if just activity fails
    }

    // 10. Reward the Pushers (Social Bonus)
    if (pushes && pushes.length > 0) {
        const uniquePushers = Array.from(new Set(pushes.map(p => p.from_user_id)))
        
        for (const pusherId of uniquePushers) {
            // Fetch current score for safety (in real app use RPC for atomic increment)
            const { data: pusher } = await supabase
                .from('users')
                .select('score')
                .eq('id', pusherId)
                .single()
            
            if (pusher) {
                await supabase
                    .from('users')
                    .update({ score: (pusher.score || 0) + 2 })
                    .eq('id', pusherId)
                
                // Optional: We could add an activity here like \"Your push worked!\", 
                // but simpler to just let them see the \"Consisted after push\" activity
            }
        }
    }

    // 11. NEW: Check for target progress
    const targetProgress = await getTargetProgress()
    
    // 12. NEW: Check and create milestones
    const milestonesResult = await checkAndCreateMilestones()
    
    // 13. NEW: Check if weekly check-in is due
    const shouldCheckin = await shouldPromptWeeklyCheckin()

    revalidatePath('/dashboard')
    
    return { 
      success: true, 
      streak: currentStreak, 
      points: points.total,
      isNewRecord: points.isNewRecord,
      targetProgress,
      newMilestones: milestonesResult.milestones,
      shouldWeeklyCheckin: shouldCheckin
    }

  } catch (error: any) {
    console.error('Punch-in error:', error)
    return { success: false, message: error.message || 'Failed to punch in' }
  }
}

/**
 * Send a push to another user
 */
export async function pushMember(targetUserId: string) {
  const supabase = await createServerClient()
  const today = getTodayDate()

  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) throw new Error('Not authenticated')
    
    const userId = session.user.id

    if (userId === targetUserId) {
        return { success: false, message: "You can't push yourself!" }
    }

    // 1. Check if sender has reached daily push limit (3)
    const { count: pushCount, error: countError } = await supabase
      .from('pushes')
      .select('*', { count: 'exact', head: true })
      .eq('from_user_id', userId)
      .eq('date', today)

    if (countError) throw countError
    if ((pushCount || 0) >= 3) {
        return { success: false, message: "You've used all 3 pushes for today!" }
    }

    // 2. Check if target has ALREADY consisted today
    const { data: targetLog } = await supabase
      .from('consist_logs')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('date', today)
      .single()

    if (targetLog) {
        return { success: false, message: "They already consisted today!" }
    }

    // 3. Check if ALREADY pushed this user today
    const { data: existingPush } = await supabase
      .from('pushes')
      .select('id')
      .eq('from_user_id', userId)
      .eq('to_user_id', targetUserId)
      .eq('date', today)
      .single()

    if (existingPush) {
        return { success: false, message: "You already pushed them today!" }
    }

    // 4. Record the push
    const { error: pushError } = await supabase
      .from('pushes')
      .insert({
        from_user_id: userId,
        to_user_id: targetUserId,
        date: today
      })

    if (pushError) throw pushError

    // 5. Create Activity
    // Fetch user details for the activity feed (need names)
    const { data: sender } = await supabase.from('users').select('name, circle_id').eq('id', userId).single()
    
    if (sender && sender.circle_id) {
        await supabase
          .from('activities')
          .insert({
            circle_id: sender.circle_id,
            actor_id: userId,
            target_id: targetUserId,
            type: 'push_sent',
            metadata: {}
          })
    }
    
    revalidatePath('/dashboard')
    
    return { success: true, remainingPushes: 2 - (pushCount || 0) }

  } catch (error: any) {
    console.error('Push error:', error)
    return { success: false, message: error.message || 'Failed to send push' }
  }
}
