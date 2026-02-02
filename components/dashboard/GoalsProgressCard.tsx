'use client'

import Link from 'next/link'
import { MacroProgress } from '@/components/transformation/MacroProgress'

interface GoalsProgressCardProps {
  current: {
    calories: number
    protein: number
    carbs: number
    fats: number
  }
  targets: {
    calories?: number | null
    protein?: number | null
    carbs?: number | null
    fats?: number | null
  }
  targetWeight?: {
    current: number
    target: number
    progress: number
  } | null
}

export function GoalsProgressCard({ current, targets, targetWeight }: GoalsProgressCardProps) {
  return (
    <div className="glass-card border border-white/10 rounded-[2rem] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white mb-1">
            Today's Goals
          </h2>
          <p className="text-xs text-slate-500">Track your progress</p>
        </div>
        <span className="text-3xl">🎯</span>
      </div>

      {/* Macro Progress */}
      <div className="pt-2">
        <MacroProgress current={current} targets={targets} />
      </div>

      {/* Weight Progress (if exists) */}
      {targetWeight && (
        <div className="glass-card border border-white/5 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500">Weight Goal</span>
            <span className="text-xs font-black text-primary">{targetWeight.progress}%</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-white">{targetWeight.current.toFixed(1)}</span>
            <span className="text-slate-500 text-xs font-bold">/ {targetWeight.target.toFixed(1)} kg</span>
          </div>
        </div>
      )}

      {/* CTA Button */}
      <Link href="/tracking">
        <button className="w-full bg-primary hover:bg-primary/90 active:scale-95 text-charcoal font-black py-3 rounded-2xl uppercase tracking-wider transition-all mt-4">
          Track Today →
        </button>
      </Link>
    </div>
  )
}
