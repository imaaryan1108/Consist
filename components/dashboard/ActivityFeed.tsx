'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { formatRelativeTime } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

type Activity = Database['public']['Tables']['activities']['Row'] & {
  actor?: Database['public']['Tables']['users']['Row']
  target?: Database['public']['Tables']['users']['Row']
}

interface ActivityFeedProps {
  circleId: string
  initialActivities?: Activity[]
}

export function ActivityFeed({ circleId, initialActivities = [] }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [loading, setLoading] = useState(!initialActivities.length)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (initialActivities.length === 0) {
      fetchActivities()
    }

    const channel = supabase
      .channel(`circle_activities:${circleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `circle_id=eq.${circleId}`,
        },
        async (payload) => {
          // When a new activity comes in, we need to fetch the actor details
          // because the payload only has the raw activity data
           const { new: newActivity } = payload
           
           const { data: fullActivity } = await supabase
             .from('activities')
             .select(`
               *,
               actor:actor_id(*),
               target:target_id(*)
             `)
             .eq('id', newActivity.id)
             .single()

            if (fullActivity) {
                setActivities(prev => [fullActivity as any, ...prev])
            }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [circleId])

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          actor:actor_id(*),
          target:target_id(*)
        `)
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      if (data) setActivities(data as any)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityContent = (activity: Activity) => {
    const actorName = activity.actor?.name || 'Unknown'
    const targetName = activity.target?.name || 'Someone'
    
    // Parse metadata safely
    const meta: any = typeof activity.metadata === 'string' 
        ? JSON.parse(activity.metadata) 
        : activity.metadata || {}

    switch (activity.type) {
      case 'consisted':
        return {
          icon: '🔥',
          color: 'text-orange-400',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/20',
          text: (
            <span>
              <span className="font-bold text-white">{actorName}</span> consisted!
              {meta.streak > 1 && <span className="text-gray-400"> ({meta.streak} day streak)</span>}
            </span>
          )
        }
      case 'streak_milestone':
        return {
          icon: '🏆',
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20',
          text: (
            <span>
              <span className="font-bold text-white">{actorName}</span> hit a {meta.streak} day streak! Legendary!
            </span>
          )
        }
      case 'consisted_after_push':
        return {
          icon: '🤝',
          color: 'text-purple-400',
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/20',
          text: (
            <span>
              <span className="font-bold text-white">{actorName}</span> consisted after a push! Teamwork!
            </span>
          )
        }
       case 'push_sent':
        return {
          icon: '👉',
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          text: (
             <span>
              <span className="font-bold text-white">{actorName}</span> pushed <span className="font-bold text-white">{targetName}</span> to consist!
            </span>
          )
        }
      default:
        return {
          icon: '📝',
          color: 'text-gray-400',
          bg: 'bg-slate-800',
          border: 'border-slate-700',
          text: <span>{actorName} did something</span>
        }
    }
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-4 text-sm">Loading activity...</div>
  }

  if (activities.length === 0) {
    return (
        <div className="text-center py-8 bg-slate-900/30 rounded-2xl border border-white/5 border-dashed">
            <div className="text-2xl mb-2">🍃</div>
            <p className="text-gray-400 text-sm">No activity yet.</p>
            <p className="text-gray-600 text-xs mt-1">Be the first to punch in!</p>
        </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest px-1">Recent Activity</h3>
      
      <div className="space-y-3 relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-4 bottom-4 w-px bg-slate-800" />

        <AnimatePresence mode='popLayout'>
        {activities.map((activity, index) => {
          const content = getActivityContent(activity)
          
          return (
            <motion.div 
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                layout
                className="relative pl-12"
            >
               {/* Timeline Node */}
               <div className={`
                    absolute left-3 top-3 w-6 h-6 -ml-3 rounded-full border-4 border-slate-950 flex items-center justify-center text-xs
                    ${content.bg} ${content.icon === '🔥' ? 'animate-pulse' : ''}
               `}>
                    {content.icon}
               </div>

              <div className={`p-4 rounded-xl border ${content.bg} ${content.border} backdrop-blur-sm`}>
                <div className="text-sm text-gray-300">
                    {content.text}
                </div>
                <div className="text-[10px] text-gray-500 mt-2 font-medium uppercase tracking-wide">
                  {formatRelativeTime(activity.created_at)}
                </div>
              </div>
            </motion.div>
          )
        })}
        </AnimatePresence>
      </div>
    </div>
  )
}
