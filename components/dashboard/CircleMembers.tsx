'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { isToday } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

type User = Database['public']['Tables']['users']['Row']

interface CircleMembersProps {
  circleId: string
  currentUserId: string
  initialMembers?: User[]
}

export function CircleMembers({ circleId, currentUserId, initialMembers = [] }: CircleMembersProps) {
  const [members, setMembers] = useState<User[]>(initialMembers)
  const [loading, setLoading] = useState(!initialMembers.length)
  const [pushLoading, setPushLoading] = useState<string | null>(null)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Initial fetch if not provided
    if (initialMembers.length === 0) {
      fetchMembers()
    }

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`circle_members:${circleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `circle_id=eq.${circleId}`,
        },
        (payload) => {
            console.log('Realtime update:', payload)
            // Refresh the full list to ensure correct sorting and data
            fetchMembers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [circleId])

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('circle_id', circleId)
        .order('current_streak', { ascending: false })

      if (error) throw error
      if (data) setMembers(data)
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePush = async (targetId: string, memberName: string) => {
    if (pushLoading) return
    setPushLoading(targetId)

    try {
        const { pushMember } = await import('@/app/actions') // Dynamic import to avoid server/client issues
        const result = await pushMember(targetId)
        
        if (result.success) {
            // Optimistically update UI to show "Pushed" state
            // In a real app we might want to track "pushed_today" in the user object
            // For now, we'll just show a temporary success state or rely on re-fetch
            alert(`Pushed ${memberName}! 👊`)
        } else {
            alert(result.message)
        }
    } catch (err) {
        console.error('Push failed', err)
    } finally {
        setPushLoading(null)
    }
  }

  // Sort members:
  // 1. Current user FIRST
  // 2. Users who consisted TODAY (active)
  // 3. Users who haven't consisted today
  // Secondary sort by streak (high to low)
  const sortedMembers = [...members].sort((a, b) => {
    if (a.id === currentUserId) return -1
    if (b.id === currentUserId) return 1

    const aConsisted = a.last_consist_date && isToday(a.last_consist_date)
    const bConsisted = b.last_consist_date && isToday(b.last_consist_date)

    if (aConsisted && !bConsisted) return -1
    if (!aConsisted && bConsisted) return 1

    return (b.current_streak || 0) - (a.current_streak || 0)
  })

  if (loading) {
     return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-900/50 rounded-2xl animate-pulse" />
            ))}
        </div>
    )
  }

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] italic">The Circle</h3>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{members.length} Active Members</span>
        </div>

      <AnimatePresence mode='popLayout'>
      {sortedMembers.map((member, index) => {
        const hasConsisted = member.last_consist_date && isToday(member.last_consist_date)
        const isMe = member.id === currentUserId
        const canPush = !isMe && !hasConsisted

        return (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            layout
            className={`
              relative overflow-hidden rounded-3xl p-5 border transition-all group
              ${hasConsisted 
                ? 'bg-primary/5 border-primary/20 shadow-neon shadow-primary/5' 
                : 'bg-white/5 border-white/5 opacity-60'
              }
            `}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                {/* Status Indicator */}
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`
                  w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg border-2
                  ${hasConsisted 
                    ? 'bg-primary border-primary text-charcoal' 
                    : 'bg-charcoal-700 border-white/5 text-slate-600'
                  }
                `}>
                  {hasConsisted ? '🔥' : '💤'}
                </motion.div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-black uppercase tracking-tight ${isMe || hasConsisted ? 'text-white' : 'text-slate-500'}`}>
                      {isMe ? 'YOU' : member.name}
                    </p>
                    {isMe && (
                        <span className="text-[8px] bg-white/10 text-slate-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                            YOU
                        </span>
                    )}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-1">
                    {hasConsisted 
                        ? <span className="text-primary italic">STREAK: {member.current_streak}D</span> 
                        : <span className="text-slate-600 italic">INACTIVE</span>}
                  </p>
                </div>
              </div>

              {/* Sidebar Stats OR Push Button */}
              <div className="text-right">
                {canPush ? (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePush(member.id, member.name)}
                        disabled={!!pushLoading}
                        className="flex items-center gap-2 bg-primary text-charcoal px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all shadow-neon"
                    >
                        {pushLoading === member.id ? '...' : (
                            <>
                                <span>PUSH</span>
                            </>
                        )}
                    </motion.button>
                ) : (
                    <div className="flex flex-col items-end">
                        <div className={`text-xl font-black italic tracking-tighter ${hasConsisted ? 'text-primary' : 'text-slate-700'}`}>
                            {member.score || 0}
                        </div>
                        <div className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em]">SCORE</div>
                    </div>
                )}
              </div>
            </div>
            
            {/* Minimal Decorative Node */}
            <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none`}>
                <span className="text-6xl font-black italic select-none">#{index + 1}</span>
            </div>
            </motion.div>
        )
      })}
      </AnimatePresence>
    </div>
  )
}
