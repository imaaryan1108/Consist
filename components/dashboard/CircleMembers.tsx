'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { isToday, getDisplayStreak } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { haptic } from '@/lib/utils/haptic'

type User = Database['public']['Tables']['users']['Row']

interface CircleMembersProps {
  circleId: string
  currentUserId: string
  initialMembers?: User[]
}

export function CircleMembers({ circleId, currentUserId, initialMembers = [] }: CircleMembersProps) {
  const [members, setMembers] = useState<User[]>(initialMembers)
  const [loading, setLoading] = useState(!initialMembers.length)
  const [pushingId, setPushingId] = useState<string | null>(null)
  const [pushedIds, setPushedIds] = useState<Set<string>>(new Set())
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (initialMembers.length === 0) fetchMembers()

    const channel = supabase
      .channel(`circle_members:${circleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `circle_id=eq.${circleId}` },
        () => fetchMembers()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [circleId])

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('circle_id', circleId)
        .order('score', { ascending: false })
      if (error) throw error
      if (data) setMembers(data)
    } catch (err) {
      console.error('Error fetching members:', err)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2500)
  }

  const handlePush = async (targetId: string, memberName: string) => {
    if (pushingId || pushedIds.has(targetId)) return
    haptic('medium')
    setPushingId(targetId)
    try {
      const { pushMember } = await import('@/app/actions')
      const result = await pushMember(targetId)
      if (result.success) {
        setPushedIds(prev => new Set(prev).add(targetId))
        showToast(`Pushed ${memberName} 👊`)
      } else {
        showToast(result.message || 'Could not push')
      }
    } catch {
      showToast('Something went wrong')
    } finally {
      setPushingId(null)
    }
  }

  // Sort: me first, then consisted, then not consisted
  const sortedMembers = [...members].sort((a, b) => {
    if (a.id === currentUserId) return -1
    if (b.id === currentUserId) return 1
    const aIn = !!(a.last_consist_date && isToday(a.last_consist_date))
    const bIn = !!(b.last_consist_date && isToday(b.last_consist_date))
    if (aIn && !bIn) return -1
    if (!aIn && bIn) return 1
    return 0
  })

  const consistedCount = members.filter(m => m.last_consist_date && isToday(m.last_consist_date)).length

  if (loading) {
    return (
      <div className="glass-card rounded-[2rem] p-5 space-y-3">
        <div className="h-3 w-24 bg-white/5 rounded-full animate-pulse" />
        <div className="flex gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-white/5 animate-pulse" />
              <div className="h-2 w-10 bg-white/5 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-[2rem] p-5 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Today's Pulse</h3>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
          {consistedCount}/{members.length} IN
        </span>
      </div>

      {/* Avatar row */}
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
        <AnimatePresence mode="popLayout">
          {sortedMembers.map((member, index) => {
            const hasConsisted = !!(member.last_consist_date && isToday(member.last_consist_date))
            const isMe = member.id === currentUserId
            const alreadyPushed = pushedIds.has(member.id)
            const canPush = !isMe && !hasConsisted
            const streak = getDisplayStreak(member.current_streak ?? 0, member.last_consist_date)

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                layout
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                {/* Avatar bubble */}
                <motion.button
                  whileTap={canPush ? { scale: 0.92 } : {}}
                  onClick={() => canPush && handlePush(member.id, member.name)}
                  disabled={!canPush || !!pushingId}
                  className="relative"
                >
                  {/* Outer glow ring */}
                  <div className={`
                    w-14 h-14 rounded-full flex items-center justify-center text-base font-black transition-all
                    ${hasConsisted
                      ? 'bg-primary text-charcoal shadow-[0_0_16px_rgba(187,247,208,0.5)]'
                      : 'bg-charcoal-700 border-2 border-white/10 text-slate-500'
                    }
                    ${canPush && !pushingId ? 'cursor-pointer' : 'cursor-default'}
                  `}>
                    {pushingId === member.id
                      ? <span className="text-xs animate-pulse">...</span>
                      : member.name.charAt(0).toUpperCase()
                    }
                  </div>

                  {/* Streak badge */}
                  {streak > 0 && (
                    <div className={`
                      absolute -bottom-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center
                      text-[9px] font-black px-1
                      ${hasConsisted ? 'bg-charcoal text-primary border border-primary/40' : 'bg-charcoal text-slate-500 border border-white/10'}
                    `}>
                      {streak}
                    </div>
                  )}

                  {/* "Pushed" indicator */}
                  {alreadyPushed && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-400 flex items-center justify-center text-[8px]">
                      👊
                    </div>
                  )}
                </motion.button>

                {/* Name */}
                <p className={`text-[10px] font-black uppercase tracking-wide max-w-[56px] text-center truncate
                  ${hasConsisted ? 'text-primary' : 'text-slate-600'}
                `}>
                  {isMe ? 'YOU' : member.name.split(' ')[0]}
                </p>

                {/* Push hint */}
                {canPush && !alreadyPushed && (
                  <p className="text-[8px] text-slate-700 uppercase tracking-wide -mt-1">tap to push</p>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none"
          >
            <span className="bg-charcoal border border-white/10 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
              {toastMsg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
