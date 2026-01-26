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
    
    const meta: any = typeof activity.metadata === 'string' 
        ? JSON.parse(activity.metadata) 
        : activity.metadata || {}

    switch (activity.type) {
      case 'consisted':
        return {
          icon: '🔥',
          color: 'text-primary',
          bg: 'bg-primary/5',
          border: 'border-white/5',
          text: (
            <span className="uppercase tracking-tighter">
              <span className="font-black text-white">{actorName}</span> PUNCHED IN
              {meta.streak > 1 && <span className="text-slate-500 font-bold ml-2 italic">#{meta.streak} STREAK</span>}
            </span>
          )
        }
      case 'streak_milestone':
        return {
          icon: '🏆',
          color: 'text-primary',
          bg: 'bg-primary/10',
          border: 'border-primary/20',
          text: (
            <span className="uppercase tracking-tighter">
              <span className="font-black text-white">{actorName}</span> HIT <span className="text-primary font-black italic">{meta.streak} DAYS</span>
            </span>
          )
        }
      case 'consisted_after_push':
        return {
          icon: '🤝',
          color: 'text-white',
          bg: 'bg-white/5',
          border: 'border-white/10',
          text: (
            <span className="uppercase tracking-tighter font-bold">
              <span className="text-white">{actorName}</span> ANSWERED THE PUSH
            </span>
          )
        }
       case 'push_sent':
        return {
          icon: '👉',
          color: 'text-slate-400',
          bg: 'bg-white/5',
          border: 'border-white/5',
          text: (
             <span className="uppercase tracking-tighter text-slate-400">
              <span className="font-black text-white">{actorName}</span> NUDGED <span className="font-black text-white">{targetName}</span>
            </span>
          )
        }
      default:
        return {
          icon: '📝',
          color: 'text-slate-500',
          bg: 'bg-white/5',
          border: 'border-white/5',
          text: <span className="uppercase tracking-tighter">{actorName} UPDATED</span>
        }
    }
  }

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-600">Syncing Activity</p>
        </div>
    )
  }

  if (activities.length === 0) {
    return (
        <div className="text-center py-12 glass-card rounded-[2rem] border-dashed">
            <div className="text-4xl mb-4 grayscale opacity-20">🍃</div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">No pulse detected.</p>
            <p className="text-slate-600 text-[10px] uppercase mt-2 font-bold tracking-wider">Start the grind to wake up the feed.</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-1 italic">Circle Pulse</h3>
      
      <div className="space-y-4 relative">
        <div className="absolute left-[23px] top-6 bottom-6 w-px bg-primary/20" />

        <AnimatePresence mode='popLayout'>
        {activities.map((activity, index) => {
          const content = getActivityContent(activity)
          
          return (
            <motion.div 
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                layout
                className="relative pl-14"
            >
               <div className={`
                    absolute left-0 top-3 w-12 h-12 rounded-2xl border-[3px] border-charcoal flex items-center justify-center text-lg z-10
                    ${content.bg} ${content.icon === '🔥' || content.icon === '🏆' ? 'neon-glow shadow-primary/20' : ''}
               `}>
                    {content.icon}
               </div>

              <div className={`p-5 rounded-3xl border ${content.bg} ${content.border} backdrop-blur-sm relative overflow-hidden group`}>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="text-4xl font-black italic select-none">#{activities.length - index}</span>
                </div>
                
                <div className="text-xs text-white font-medium relative z-10 font-bold">
                    {content.text}
                </div>
                <div className="text-[10px] text-slate-600 mt-2 font-black uppercase tracking-widest">
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
