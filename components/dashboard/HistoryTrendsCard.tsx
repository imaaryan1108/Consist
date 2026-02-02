'use client'

import Link from 'next/link'

interface HistoryTrendsCardProps {
  weekSummary: {
    daysTracked: number
    totalCalories: number
    avgCalories: number
    totalProtein: number
    workoutsCompleted: number
  }
}

export function HistoryTrendsCard({ weekSummary }: HistoryTrendsCardProps) {
  return (
    <div className="glass-card border border-white/10 rounded-[2rem] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white mb-1">
            This Week
          </h2>
          <p className="text-xs text-slate-500">Your progress summary</p>
        </div>
        <span className="text-3xl">📊</span>
      </div>

      {/* Week Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Days Tracked */}
        <div className="glass-card border border-white/5 rounded-2xl p-3">
          <div className="text-2xl font-black text-primary mb-1">
            {weekSummary.daysTracked}/7
          </div>
          <div className="text-[10px] text-slate-600 font-bold uppercase">
            Days Tracked
          </div>
        </div>

        {/* Avg Calories */}
        <div className="glass-card border border-white/5 rounded-2xl p-3">
          <div className="text-2xl font-black text-white mb-1">
            {Math.round(weekSummary.avgCalories)}
          </div>
          <div className="text-[10px] text-slate-600 font-bold uppercase">
            Avg kcal/day
          </div>
        </div>

        {/* Total Protein */}
        <div className="glass-card border border-white/5 rounded-2xl p-3">
          <div className="text-2xl font-black text-green-400 mb-1">
            {Math.round(weekSummary.totalProtein)}g
          </div>
          <div className="text-[10px] text-slate-600 font-bold uppercase">
            Total Protein
          </div>
        </div>

        {/* Workouts */}
        <div className="glass-card border border-white/5 rounded-2xl p-3">
          <div className="text-2xl font-black text-blue-400 mb-1">
            {weekSummary.workoutsCompleted}
          </div>
          <div className="text-[10px] text-slate-600 font-bold uppercase">
            Workouts
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Link href="/history">
        <button className="w-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-primary/50 text-white font-black py-3 rounded-2xl uppercase tracking-wider transition-all mt-4">
          View History →
        </button>
      </Link>
    </div>
  )
}
