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
    <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Circle Members</h3>
            <span className="text-xs text-gray-500">{members.length} members</span>
        </div>

      <AnimatePresence mode='popLayout'>
      {sortedMembers.map((member, index) => {
        const hasConsisted = member.last_consist_date && isToday(member.last_consist_date)
        const isMe = member.id === currentUserId
        const canPush = !isMe && !hasConsisted

        return (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            layout
            className={`
              relative overflow-hidden rounded-2xl p-4 border transition-all
              ${hasConsisted 
                ? 'bg-slate-900/80 border-green-500/20 shadow-lg shadow-green-900/10' 
                : 'bg-slate-900/40 border-white/5 opacity-80'
              }
            `}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                {/* Status Indicator */}
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner
                  ${hasConsisted 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-900/50' 
                    : 'bg-slate-800 text-gray-500'
                  }
                `}>
                  {hasConsisted ? '✅' : '💤'}
                </motion.div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className={`font-bold ${isMe ? 'text-white' : 'text-gray-300'}`}>
                      {isMe ? 'You' : member.name}
                    </p>
                    {isMe && (
                        <span className="text-[10px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Me
                        </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {hasConsisted 
                        ? `${member.current_streak} day streak 🔥` 
                        : 'Hasn\'t consisted yet'}
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
                        className="group flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                    >
                        {pushLoading === member.id ? '...' : (
                            <>
                                <span>👉</span>
                                <span>PUSH</span>
                            </>
                        )}
                    </motion.button>
                ) : (
                    <>
                        <div className={`text-xl font-bold ${hasConsisted ? 'text-green-400' : 'text-gray-600'}`}>
                            {member.score || 0}
                        </div>
                        <div className="text-[10px] text-gray-600 uppercase tracking-wider">Points</div>
                    </>
                )}
              </div>
            </div>
            
            {/* Background Glow for Active Users */}
            {hasConsisted && (
                <div className="absolute -right-4 -top-12 w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />
            )}
            </motion.div>
        )
      })}
      </AnimatePresence>
    </div>
  )
}
