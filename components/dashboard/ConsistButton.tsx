'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { punchIn } from '@/app/actions'
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
      
      // Update the dashboard data immediately
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
          colors: ['#f97316', '#a855f7', '#ec4899'] // Orange, Purple, Pink
        })
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f97316', '#a855f7', '#ec4899']
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
          className="w-full py-6 rounded-2xl bg-slate-800 border-2 border-green-500/30 text-green-400 font-bold text-xl flex flex-col items-center justify-center gap-2 transition-all cursor-default"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <span>You Consisted Today!</span>
          </div>
          <p className="text-sm font-normal text-gray-400 opacity-75">
            {getStreakMessage(streak)}
          </p>
        </button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2">
      <button
        onClick={handleConsist}
        disabled={loading}
        className="group relative w-full rounded-2xl bg-gradient-to-r from-orange-500 to-purple-600 p-[3px] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/20 active:scale-[0.98]"
      >
        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative w-full bg-slate-900 rounded-[13px] flex flex-col items-center justify-center gap-2 py-6 group-hover:bg-slate-900/90 transition-all">
          {loading ? (
            <div className="flex items-center gap-2 text-white/50">
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Punching in...</span>
            </div>
          ) : (
            <>
              <span className="text-4xl">👊</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent group-hover:text-white transition-colors">
                I Consisted Today
              </span>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                Tap to maintain streak
              </p>
            </>
          )}
        </div>
      </button>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
