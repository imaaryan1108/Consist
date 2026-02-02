'use client'

import { useState } from 'react'

interface WeekSelectorProps {
  startDate: string
  endDate: string
  onWeekChange: (direction: 'prev' | 'next') => void
  isCurrentWeek: boolean
}

export function WeekSelector({ startDate, endDate, onWeekChange, isCurrentWeek }: WeekSelectorProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex items-center justify-between glass-card rounded-2xl p-4 border border-white/10">
      <button
        onClick={() => onWeekChange('prev')}
        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 transition-all flex items-center justify-center text-white font-bold active:scale-95"
      >
        ←
      </button>

      <div className="text-center">
        <div className="text-sm font-black text-white uppercase tracking-wide">
          {formatDate(startDate)} - {formatDate(endDate)}
        </div>
        {isCurrentWeek && (
          <div className="text-[10px] text-primary font-bold uppercase tracking-wider mt-1">
            Current Week
          </div>
        )}
      </div>

      <button
        onClick={() => onWeekChange('next')}
        disabled={isCurrentWeek}
        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 transition-all flex items-center justify-center text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
      >
        →
      </button>
    </div>
  )
}
