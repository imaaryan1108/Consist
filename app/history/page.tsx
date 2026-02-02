'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { getWeeklySummary, getDailyLogsForWeek } from '@/app/actions/history'
import { getWeekDatesWithOffset } from '@/lib/utils/date'
import { WeekSelector } from '@/components/history/WeekSelector'
import { WeeklySummaryCard } from '@/components/history/WeeklySummaryCard'
import { DailyHistoryCard } from '@/components/history/DailyHistoryCard'

export default function HistoryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  
  // Week navigation state
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week, -1 = last week, etc
  const [weekDates, setWeekDates] = useState({ startDate: '', endDate: '' })
  const [weeklySummary, setWeeklySummary] = useState<any>(null)
  const [dailyLogs, setDailyLogs] = useState<any[]>([])



  // Fetch data for current week selection
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      setLoading(true)
      const dates = getWeekDatesWithOffset(weekOffset)
      setWeekDates(dates)
      
      try {
        const [summary, logs] = await Promise.all([
          getWeeklySummary(dates.startDate, dates.endDate),
          getDailyLogsForWeek(dates.startDate, dates.endDate)
        ])
        
        setWeeklySummary(summary)
        setDailyLogs(logs)
      } catch (error) {
        console.error('Error fetching history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [weekOffset, user])

  const handleWeekChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setWeekOffset(prev => prev - 1)
    } else if (direction === 'next' && weekOffset < 0) {
      setWeekOffset(prev => prev + 1)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-charcoal p-4 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              History
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">
              Week-by-week progress
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 transition-all flex items-center justify-center text-white font-bold text-xl active:scale-95"
          >
            ←
          </button>
        </header>

        {/* Week Selector */}
        <WeekSelector
          startDate={weekDates.startDate}
          endDate={weekDates.endDate}
          onWeekChange={handleWeekChange}
          isCurrentWeek={weekOffset === 0}
        />

        {loading ? (
          <div className="text-center py-12">
            <div className="text-slate-500 text-sm">Loading...</div>
          </div>
        ) : (
          <>
            {/* Weekly Summary */}
            {weeklySummary && (
              <WeeklySummaryCard
                summary={{
                  daysTracked: weeklySummary.daysTracked,
                  totalCalories: weeklySummary.totalCalories,
                  avgCalories: weeklySummary.avgCalories,
                  totalProtein: weeklySummary.totalProtein,
                  totalCarbs: weeklySummary.totalCarbs,
                  totalFats: weeklySummary.totalFats,
                  workoutsCompleted: weeklySummary.workoutsCompleted,
                  mealCount: weeklySummary.mealCount
                }}
              />
            )}

            {/* Daily Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">
                Daily Breakdown
              </h3>
              {dailyLogs.length > 0 ? (
                dailyLogs.map((day) => (
                  <DailyHistoryCard key={day.date} day={day} />
                ))
              ) : (
                <div className="glass-card rounded-2xl p-8 text-center border border-white/5">
                  <div className="text-4xl mb-3">📊</div>
                  <p className="text-sm text-slate-500 font-bold">
                    No data for this week
                  </p>
                  <p className="text-xs text-slate-600 mt-2">
                    Start tracking to see your progress here
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
