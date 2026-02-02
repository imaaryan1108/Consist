'use client'

interface DailyHistoryCardProps {
  day: {
    date: string
    meals: number
    calories: number
    protein: number
    carbs: number
    fats: number
    water: number
    workouts: number
  }
}

export function DailyHistoryCard({ day }: DailyHistoryCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dateFormatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { dayName, dateFormatted }
  }

  const { dayName, dateFormatted } = formatDate(day.date)
  const hasActivity = day.meals > 0 || day.workouts > 0

  return (
    <div className={`glass-card rounded-2xl p-4 border ${hasActivity ? 'border-white/10' : 'border-white/5 opacity-50'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-black text-white uppercase">
            {dayName}
          </div>
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
            {dateFormatted}
          </div>
        </div>
        {hasActivity ? (
          <div className="text-primary text-lg">✓</div>
        ) : (
          <div className="text-slate-700 text-sm">No data</div>
        )}
      </div>

      {hasActivity && (
        <div className="grid grid-cols-2 gap-2">
          {/* Meals */}
          <div className="bg-white/5 rounded-xl p-2">
            <div className="text-xs text-slate-600 font-bold uppercase mb-1">Meals</div>
            <div className="text-lg font-black text-white">{day.meals}</div>
          </div>

          {/* Calories */}
          <div className="bg-white/5 rounded-xl p-2">
            <div className="text-xs text-slate-600 font-bold uppercase mb-1">kCal</div>
            <div className="text-lg font-black text-primary">{Math.round(day.calories)}</div>
          </div>

          {/* Macros Row */}
          <div className="col-span-2 flex gap-2">
            <div className="flex-1 bg-white/5 rounded-xl p-2">
              <div className="text-[10px] text-slate-600 font-bold uppercase mb-1">🥩 Protein</div>
              <div className="text-sm font-black text-green-400">{Math.round(day.protein)}g</div>
            </div>
            <div className="flex-1 bg-white/5 rounded-xl p-2">
              <div className="text-[10px] text-slate-600 font-bold uppercase mb-1">🍚 Carbs</div>
              <div className="text-sm font-black text-orange-400">{Math.round(day.carbs)}g</div>
            </div>
            <div className="flex-1 bg-white/5 rounded-xl p-2">
              <div className="text-[10px] text-slate-600 font-bold uppercase mb-1">🥑 Fats</div>
              <div className="text-sm font-black text-yellow-400">{Math.round(day.fats)}g</div>
            </div>
          </div>

          {/* Workouts */}
          {day.workouts > 0 && (
            <div className="col-span-2 bg-blue-500/10 border border-blue-400/30 rounded-xl p-2">
              <div className="text-xs text-blue-400 font-bold uppercase">
                💪 {day.workouts} Workout{day.workouts > 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
