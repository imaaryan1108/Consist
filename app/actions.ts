'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateStreak, calculateConsistPoints, getTodayDate, isYesterday, getStreakMessage } from '@/lib/utils'

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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user || !user.circle_id) throw new Error('User not found or no circle')

    // 4. Get logs for streak calculation (fetch last 365 days to be safe)
    const { data: logs } = await supabase
      .from('consist_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(365)

    // 5. Check if was pushed today
    const { data: pushes } = await supabase
      .from('pushes')
      .select('id')
      .eq('to_user_id', userId)
      .eq('date', today)
      .limit(1)

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

    revalidatePath('/dashboard')
    
    return { 
      success: true, 
      streak: currentStreak, 
      points: points.total,
      isNewRecord: points.isNewRecord
    }

  } catch (error: any) {
    console.error('Punch-in error:', error)
    return { success: false, message: error.message || 'Failed to punch in' }
  }
}
