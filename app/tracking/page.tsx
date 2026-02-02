import { createServerClient } from '@/lib/supabase/server'
import { getMealsForDate, getDailySummary } from '@/app/actions/meals'
import { getWorkoutForDate } from '@/app/actions/workouts'
import { getTarget } from '@/app/actions/targets'
import { MealLogger } from '@/components/transformation/MealLogger'
import { MacroProgress } from '@/components/transformation/MacroProgress'
import { DetailedExerciseLogger } from '@/components/transformation/DetailedExerciseLogger'
import { WorkoutHistory } from '@/components/transformation/WorkoutHistory'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TrackingPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/')
  }

  // Get today's data
  const dailySummary = await getDailySummary()
  const todayWorkout = await getWorkoutForDate()
  const target = await getTarget()

  return (
    <main className="min-h-screen bg-charcoal p-4 pb-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all flex items-center justify-center text-white hover:text-primary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic mb-2">
            Daily Tracking
          </h1>
          <p className="text-slate-500 text-sm font-bold">
            Log your nutrition and workouts
          </p>
          </div>
        </div>

        {/* Macro Progress Tracker */}
        <div className="glass-card border border-white/10 rounded-[2rem] p-6 mb-6">
          <MacroProgress
            current={{
              calories: dailySummary.total_calories,
              protein: dailySummary.total_protein,
              carbs: dailySummary.total_carbs,
              fats: dailySummary.total_fats
            }}
            targets={{
              calories: target?.target_calories_daily,
              protein: target?.target_protein_g_daily,
              carbs: target?.target_carbs_g_daily,
              fats: target?.target_fats_g_daily
            }}
          />
          
          {dailySummary.meal_count > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-bold">
                {dailySummary.meal_count} meal{dailySummary.meal_count !== 1 ? 's' : ''} logged • {(dailySummary.total_water / 1000).toFixed(1)}L water
              </div>
            </div>
          )}
        </div>

        {/* Meal Logging */}
        <div className="glass-card border border-white/10 rounded-[2rem] p-6 mb-6">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
            Log Meal
          </h2>
          <MealLogger />
        </div>

        {/* Workout Logging */}
        <div className="glass-card border border-white/10 rounded-[2rem] p-6 mb-6">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
            Log Workout
          </h2>
          <DetailedExerciseLogger />
        </div>

        {/* Meals List */}
        {dailySummary.meals.length > 0 && (
          <div className="glass-card border border-white/10 rounded-[2rem] p-6">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
              Today's Meals
            </h2>
            <div className="space-y-3">
              {dailySummary.meals.map((meal) => (
                <div
                  key={meal.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-black text-primary uppercase">
                        {meal.meal_type}
                      </span>
                      <p className="text-white font-bold mt-1">{meal.food_name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-white">
                        {meal.calories}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold">kcal</div>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-wrap text-xs">
                    {meal.protein_g && (
                      <div className="text-slate-500">
                        <span className="mr-1">🥩</span>{meal.protein_g}g protein
                      </div>
                    )}
                    {meal.carbs_g && (
                      <div className="text-slate-500">
                        <span className="mr-1">🍚</span>{meal.carbs_g}g carbs
                      </div>
                    )}
                    {meal.fats_g && (
                      <div className="text-slate-500">
                        <span className="mr-1">🥑</span>{meal.fats_g}g fats
                      </div>
                    )}
                    {meal.water_ml && (
                      <div className="text-slate-500">
                        <span className="mr-1">💧</span>{meal.water_ml}ml
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workout History */}
        <WorkoutHistory limit={7} />
      </div>
    </main>
  )
}
