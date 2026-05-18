'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getNextTitle, TitleProgress } from '@/app/actions/title-progress'
import { TITLES, RARITY_COLORS } from '@/lib/gamification/titles-config'

interface Props { userId: string }

export function NextTitleCard({ userId }: Props) {
  const [next, setNext] = useState<TitleProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNextTitle(userId).then(t => { setNext(t); setLoading(false) })
  }, [userId])

  if (loading || !next) return null

  const title = TITLES[next.title_key]
  if (!title) return null

  const colors = RARITY_COLORS[title.rarity]
  const remaining = next.required - next.current
  const isClose = next.pct >= 50

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border p-4 ${colors}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="text-3xl">{title.emoji}</span>
          {/* Lock icon overlay */}
          <span className="absolute -bottom-1 -right-1 text-[10px]">🔒</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Next Title</p>
            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${colors}`}>
              {title.rarity}
            </span>
          </div>
          <p className="font-black tracking-tight leading-tight">{title.label}</p>
          <p className="text-[11px] opacity-60 font-medium mt-0.5">
            {remaining === 0
              ? 'Almost there — punch in!'
              : `${remaining} more ${getUnit(next.title_key, remaining)} to unlock`}
          </p>
        </div>

        {/* Progress circle */}
        <div className="flex-shrink-0 relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="2.5" />
            <motion.circle
              cx="18" cy="18" r="15.9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="100"
              initial={{ strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 100 - next.pct }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-black">{next.pct}%</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-current opacity-10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-current rounded-full"
          style={{ opacity: 1 }}
          initial={{ width: 0 }}
          animate={{ width: `${next.pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-black opacity-50">{next.current} / {next.required}</span>
        {isClose && <span className="text-[9px] font-black opacity-70">🔥 So close!</span>}
      </div>
    </motion.div>
  )
}

function getUnit(key: string, n: number): string {
  const units: Record<string, string> = {
    anchor: n === 1 ? 'day' : 'days',
    ghost: n === 1 ? 'day' : 'days',
    machine: n === 1 ? 'day' : 'days',
    pusher: n === 1 ? 'push' : 'pushes',
    comeback_kid: 'comeback',
    iron_will: 'day',
    feeder: n === 1 ? 'meal' : 'meals',
    macro_god: n === 1 ? 'day' : 'days',
  }
  return units[key] ?? 'steps'
}
