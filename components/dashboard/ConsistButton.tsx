'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { punchIn } from '@/app/actions'
import { motion } from 'framer-motion'
import { getStreakMessage } from '@/lib/utils'

interface ConsistButtonProps {
  hasConsisted: boolean
  currentStreak: number
}

export function ConsistButton({ hasConsisted, currentStreak }: ConsistButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [consisted, setConsisted] = useState(hasConsisted)
  const [streak, setStreak] = useState(currentStreak)
  const [error, setError] = useState('')

  const handleConsist = async () => {
    if (loading || consisted) return

    setLoading(true)
    setError('')

    try {
      const result = await punchIn()

      if (!result.success) {
        throw new Error(result.message)
      }

      setConsisted(true)
      if (result.streak) setStreak(result.streak)
      
      router.refresh()
      
      // FIRE CONFETTI! 🎉
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#C6FF00', '#D9FF66', '#E5FF99'] // Lime shades
        })
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#C6FF00', '#D9FF66', '#E5FF99']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (consisted) {
    return (
      <div className="w-full">
        <button
          disabled
          className="w-full py-8 rounded-[2.5rem] bg-charcoal-700 border-2 border-primary/20 text-primary font-black text-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-default shadow-neon"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <span className="tracking-tighter uppercase">ELITE CONSISTENCY</span>
          </div>
          <p className="text-[10px] uppercase font-black text-primary/60 tracking-[0.2em]">
            {getStreakMessage(streak)}
          </p>
        </button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <motion.button
        onClick={handleConsist}
        disabled={loading}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="group relative w-full rounded-[2.5rem] bg-primary p-1 transition-all"
      >
        <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative w-full bg-charcoal rounded-[2.2rem] flex flex-col items-center justify-center gap-3 py-10 group-hover:bg-charcoal/90 transition-all">
          {loading ? (
            <div className="flex items-center gap-2 text-primary">
              <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <>
              <motion.div 
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} 
                transition={{ repeat: Infinity, duration: 4 }}
                className="text-6xl"
              >
                👊
              </motion.div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-white tracking-tighter uppercase italic group-hover:text-primary transition-colors">
                  PUNCH IN
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] mt-1">
                  Commit to the grind
                </span>
              </div>
            </>
          )}
        </div>
      </motion.button>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-400 text-xs font-bold uppercase tracking-widest">
          {error}
        </div>
      )}
    </div>
  )
}
