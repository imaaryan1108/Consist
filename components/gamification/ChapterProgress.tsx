'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getCurrentChapterProgress, getCircleChapters } from '@/app/actions/chapters'
import { CHAPTERS } from '@/lib/gamification/titles-config'
import { track } from '@/lib/analytics/analytics'

interface Props { circleId: string }

export function ChapterProgress({ circleId }: Props) {
  const [progress, setProgress] = useState<any>(null)
  const [completedChapters, setCompletedChapters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getCurrentChapterProgress(circleId),
      getCircleChapters(circleId),
    ]).then(([prog, chapters]) => {
      setProgress(prog)
      const completed = chapters.filter((c: any) => c.is_complete)
      // Track any newly completed chapter (first time seeing it)
      const justCompleted = completed.find((c: any) => {
        const age = Date.now() - new Date(c.completed_at).getTime()
        return age < 60000 // completed within last minute
      })
      if (justCompleted) {
        track.chapterCompleted({
          chapter_number: justCompleted.chapter_number,
          chapter_name: justCompleted.chapter_name,
          punch_in_rate: justCompleted.punch_in_rate,
        })
      }
      setCompletedChapters(completed)
      setLoading(false)
    })
  }, [circleId])

  if (loading || !progress) return null

  const { chapter, rate, daysLeft, punchIns, possible } = progress
  const pct = Math.min(100, (rate / chapter.threshold) * 100)
  const isOnTrack = rate >= chapter.threshold * 0.75
  const isAchieved = rate >= chapter.threshold

  return (
    <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-5 relative overflow-hidden" style={{ background: chapter.gradient }}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-20 pointer-events-none" />
        <div className={`relative z-10 flex items-start justify-between ${chapter.darkText ? 'text-charcoal' : 'text-white'}`}>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-1 ${chapter.darkText ? 'text-charcoal/60' : 'text-white/60'}`}>
              Chapter {chapter.number}
            </p>
            <h3 className="text-2xl font-black tracking-tighter">{chapter.name}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black">
              {rate.toFixed(0)}%
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${chapter.darkText ? 'text-charcoal/60' : 'text-white/60'}`}>
              {isAchieved ? 'Achieved ✓' : `Need ${chapter.threshold}%`}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Progress bar toward threshold */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Circle Punch-in Rate
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {punchIns} / {possible} punch-ins
            </span>
          </div>
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
              className={`h-full rounded-full relative ${isAchieved ? 'bg-primary' : isOnTrack ? 'bg-blue-400' : 'bg-slate-500'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </motion.div>
          </div>
          {/* Threshold marker */}
          <div className="relative h-3">
            <div
              className="absolute top-0 w-0.5 h-3 bg-white/30"
              style={{ left: `${Math.min(100, chapter.threshold)}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-2xl p-3 text-center">
            <div className="text-xl font-black text-white">{daysLeft}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Days Left</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center">
            <div className={`text-xl font-black ${isOnTrack ? 'text-green-400' : 'text-amber-400'}`}>
              {isOnTrack ? '✓' : '↑'}
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
              {isOnTrack ? 'On Track' : 'Needs Push'}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center">
            <div className="text-xl font-black text-white">{chapter.threshold}%</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Goal</div>
          </div>
        </div>

        {/* Completed chapters */}
        {completedChapters.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Completed</p>
            <div className="flex flex-wrap gap-2">
              {completedChapters.map((c: any) => {
                const ch = CHAPTERS.find(ch => ch.number === c.chapter_number)
                return (
                  <motion.div
                    key={c.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                    style={{ background: ch?.gradient ?? 'linear-gradient(135deg,#64748b,#94a3b8)', color: ch?.darkText ? '#0D0D0D' : '#fff' }}
                  >
                    Ch.{c.chapter_number} {c.chapter_name} ✓
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
