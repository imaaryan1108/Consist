'use client'

interface WeeklySummaryCardProps {
  summary: {
    daysTracked: number
    totalCalories: number
    avgCalories: number
    totalProtein: number
    totalCarbs: number
    totalFats: number
    workoutsCompleted: number
    mealCount: number
  }
}

export function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  return (
    <div className="glass-card border border-white/10 rounded-2xl p-5">
      <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">
        Week Summary
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Days Tracked */}
        <div className="glass-card border border-white/5 rounded-xl p-3">
          <div className="text-2xl font-black text-primary mb-1">
            {summary.daysTracked}/7
          </div>
          <div className="text-[10px] text-slate-600 font-bold uppercase">
            Days Tracked
          </div>
        </div>

        {/* Workouts */}
        <div className="glass-card border border-white/5 rounded-xl p-3">
          <div className="text-2xl font-black text-blue-400 mb-1">
            {summary.workoutsCompleted}
          </div>
          <div className="text-[10px] text-slate-600 font-bold uppercase">
            Workouts
          </div>
        </div>
      </div>

      {/* Nutrition Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-bold uppercase">Total Calories</span>
          <span className="text-sm text-white font-black">{Math.round(summary.totalCalories)} kcal</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-bold uppercase">Avg Calories/Day</span>
          <span className="text-sm text-primary font-black">{Math.round(summary.avgCalories)} kcal</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-bold uppercase">Total Protein</span>
          <span className="text-sm text-green-400 font-black">{Math.round(summary.totalProtein)}g</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-bold uppercase">Total Carbs</span>
          <span className="text-sm text-orange-400 font-black">{Math.round(summary.totalCarbs)}g</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-bold uppercase">Total Fats</span>
          <span className="text-sm text-yellow-400 font-black">{Math.round(summary.totalFats)}g</span>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2">
          <span className="text-xs text-slate-500 font-bold uppercase">Meals Logged</span>
          <span className="text-sm text-white font-black">{summary.mealCount}</span>
        </div>
      </div>
    </div>
  )
}
