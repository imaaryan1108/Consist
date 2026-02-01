'use client'

import { useEffect, useState } from 'react'
import { getWorkoutHistory } from '@/app/actions/exercises'

interface Exercise {
  id: string
  exercise_name: string
  sets: number
  reps: number
  weight_kg: number | null
  notes: string | null
}

interface WorkoutWithExercises {
  id: string
  date: string
  workout_type: string
  total_exercises: number
  exercises: Exercise[]
}

export function WorkoutHistory({ limit = 7 }: { limit?: number }) {
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkouts()
  }, [])

  const loadWorkouts = async () => {
    setLoading(true)
    const history = await getWorkoutHistory(limit)
    setWorkouts(history as any)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="glass-card border border-white/10 rounded-3xl p-6 text-center">
        <p className="text-slate-500 text-sm">Loading workout history...</p>
      </div>
    )
  }

  if (workouts.length === 0) {
    return (
      <div className="glass-card border border-white/10 border-dashed rounded-3xl p-6 text-center">
        <div className="text-4xl mb-2">💪</div>
        <p className="text-slate-500 text-sm font-bold">No workouts logged yet</p>
        <p className="text-slate-600 text-xs mt-1">Start tracking your exercises above!</p>
      </div>
    )
  }

  return (
    <div className="glass-card border border-white/10 rounded-[2rem] p-6 mt-6">
      <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
        Workout History
      </h2>
      
      <div className="space-y-3">
        {workouts.map((workout) => (
          <div key={workout.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            {/* Workout Header */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
              <div>
                <p className="text-xs text-slate-500 font-bold">
                  {new Date(workout.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="text-xs text-slate-600 font-bold">
                {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-3">
              {workout.exercises.map((exercise) => (
                <div key={exercise.id} className="bg-white/5 rounded-xl p-3">
                  <h4 className="text-white font-bold text-sm mb-2">
                    {exercise.exercise_name}
                  </h4>
                  <div className="flex gap-3 text-xs">
                    <span className="text-primary font-bold">
                      {exercise.sets} sets
                    </span>
                    <span className="text-green-400 font-bold">
                      {exercise.reps} reps
                    </span>
                    {exercise.weight_kg && exercise.weight_kg > 0 && (
                      <span className="text-blue-400 font-bold">
                        {exercise.weight_kg} kg
                      </span>
                    )}
                  </div>
                  {exercise.notes && (
                    <p className="text-slate-500 text-xs mt-2 italic">{exercise.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
