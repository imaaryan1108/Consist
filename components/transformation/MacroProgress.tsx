'use client'

import { useEffect, useState } from 'react'

interface MacroProgressProps {
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
}

interface MacroItemProps {
  icon: string
  label: string
  current: number
  target?: number | null
  unit: string
}

function MacroProgressItem({ icon, label, current, target, unit }: MacroItemProps) {
  if (!target || target === 0) {
    // No target set - just show current value
    return (
      <div className="glass-card rounded-2xl p-3 border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">{icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{label}</span>
          </div>
          <span className="text-slate-500 text-[10px] font-medium truncate">No goal</span>
        </div>
        <div className="text-lg font-black text-white">
          {Math.round(current)}{unit}
        </div>
      </div>
    )
  }

  const percentage = (current / target) * 100
  const isOnTrack = percentage >= 85 && percentage <= 100
  const isSlightlyOver = percentage > 100 && percentage <= 115
  const isWayOver = percentage > 115

  // Color coding
  let barColor = 'bg-primary' // Green - on track (85-100%)
  let statusEmoji = '✅'
  let textColor = 'text-primary'

  if (percentage < 85) {
    // Under target - neutral/gray (working towards it)
    barColor = 'bg-slate-500'
    statusEmoji = '⏳'
    textColor = 'text-slate-400'
  } else if (isSlightlyOver) {
    // Slightly over (100-115%) - yellow warning
    barColor = 'bg-yellow-500'
    statusEmoji = '⚠️'
    textColor = 'text-yellow-500'
  } else if (isWayOver) {
    // Way over (>115%) - red alert
    barColor = 'bg-red-500'
    statusEmoji = '❌'
    textColor = 'text-red-500'
  }

  return (
    <div className="glass-card rounded-2xl p-3 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xl">{icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`text-[10px] font-black ${textColor}`}>{Math.round(percentage)}%</span>
          <span className="text-xs">{statusEmoji}</span>
        </div>
      </div>

      {/* Values */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-lg font-black text-white">{Math.round(current)}</span>
        <span className="text-slate-500 text-xs font-bold">/ {Math.round(target)}{unit}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-charcoal-700 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

export function MacroProgress({ current, targets }: MacroProgressProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-4 h-24 border border-white/5" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Today's Progress</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MacroProgressItem
          icon="🔥"
          label="kCal"
          current={current.calories}
          target={targets.calories}
          unit="kcal"
        />
        <MacroProgressItem
          icon="🥩"
          label="Protein"
          current={current.protein}
          target={targets.protein}
          unit="g"
        />
        <MacroProgressItem
          icon="🍚"
          label="Carbs"
          current={current.carbs}
          target={targets.carbs}
          unit="g"
        />
        <MacroProgressItem
          icon="🥑"
          label="Fats"
          current={current.fats}
          target={targets.fats}
          unit="g"
        />
      </div>
    </div>
  )
}
