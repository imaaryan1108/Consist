'use client'

import { useState } from 'react'
import { logExercise } from '@/app/actions/exercises'
import { logWorkout } from '@/app/actions/workouts'

interface Exercise {
  id: string
  exercise_name: string
  sets: number
  reps: number
  weight_kg: number
  notes?: string
}

export function DetailedExerciseLogger({ onSuccess }: { onSuccess?: () => void }) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [currentExercise, setCurrentExercise] = useState({
    exercise_name: '',
    sets: '',
    reps: '',
    weight_kg: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const addExercise = () => {
    if (!currentExercise.exercise_name || !currentExercise.sets || !currentExercise.reps) {
      setMessage('❌ Please fill exercise name, sets, and reps')
      return
    }

    const newExercise: Exercise = {
      id: Math.random().toString(36).substr(2, 9),
      exercise_name: currentExercise.exercise_name,
      sets: parseInt(currentExercise.sets),
      reps: parseInt(currentExercise.reps),
      weight_kg: currentExercise.weight_kg ? parseFloat(currentExercise.weight_kg) : 0
    }

    setExercises([...exercises, newExercise])
    setCurrentExercise({ exercise_name: '', sets: '', reps: '', weight_kg: '' })
    setMessage('')
  }

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id))
  }

  const saveWorkout = async () => {
    if (exercises.length === 0) {
      setMessage('❌ Add at least one exercise')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // First create the workout log
      const workoutResult = await logWorkout({
        workout_type: 'gym',
        duration_minutes: 0
      })

      if (!workoutResult.success || !workoutResult.workout_id) {
        throw new Error(workoutResult.message)
      }

      // Then log all exercises
      const exercisePromises = exercises.map(exercise =>
        logExercise({
          workout_log_id: workoutResult.workout_id!,
          exercise_name: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight_kg: exercise.weight_kg || undefined
        })
      )

      const results = await Promise.all(exercisePromises)
      const failed = results.filter(r => !r.success)

      if (failed.length > 0) {
        throw new Error('Some exercises failed to save')
      }

      setMessage(`✅ Workout saved! ${exercises.length} exercises logged`)
      setExercises([])
      
      setTimeout(() => {
        setMessage('')
        onSuccess?.()
      }, 2000)
    } catch (error: any) {
      setMessage(`❌ ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Add Exercise Form */}
      <div className="glass-card border border-white/10 rounded-3xl p-5">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">
          Add Exercise
        </h3>

        <div className="space-y-3">
          {/* Exercise Name */}
          <input
            type="text"
            placeholder="Exercise name (e.g., Inclined Chest Press)"
            value={currentExercise.exercise_name}
            onChange={(e) => setCurrentExercise({ ...currentExercise, exercise_name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
          />

          {/* Sets, Reps, Weight Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Sets</label>
              <input
                type="number"
                placeholder="3"
                value={currentExercise.sets}
                onChange={(e) => setCurrentExercise({ ...currentExercise, sets: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Reps</label>
              <input
                type="number"
                placeholder="12"
                value={currentExercise.reps}
                onChange={(e) => setCurrentExercise({ ...currentExercise, reps: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                placeholder="15"
                value={currentExercise.weight_kg}
                onChange={(e) => setCurrentExercise({ ...currentExercise, weight_kg: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={addExercise}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 text-white font-black py-3 rounded-2xl uppercase tracking-wider transition-all"
          >
            + Add Exercise
          </button>
        </div>
      </div>

      {/* Exercises List */}
      {exercises.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider px-2">
            Today's Workout ({exercises.length} exercise{exercises.length !== 1 ? 's' : ''})
          </h3>
          
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="glass-card border border-white/10 rounded-2xl p-4 relative group"
            >
              <button
                onClick={() => removeExercise(exercise.id)}
                className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <span className="text-xl">×</span>
              </button>

              <h4 className="text-white font-black mb-2 pr-6">{exercise.exercise_name}</h4>
              <div className="flex gap-4 text-sm">
                <span className="text-primary font-bold">
                  {exercise.sets} sets
                </span>
                <span className="text-green-400 font-bold">
                  {exercise.reps} reps
                </span>
                {exercise.weight_kg > 0 && (
                  <span className="text-blue-400 font-bold">
                    {exercise.weight_kg} kg
                  </span>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={saveWorkout}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-charcoal font-black py-4 rounded-2xl uppercase tracking-wider shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : '✅ Complete Workout'}
          </button>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-2xl text-center text-sm font-bold border ${
          message.includes('✅') 
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
