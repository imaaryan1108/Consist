'use client'

import { useState } from 'react'
import { logWorkout } from '@/app/actions/workouts'

interface WorkoutLoggerProps {
  onSuccess?: () => void
}

export function WorkoutLogger({ onSuccess }: WorkoutLoggerProps) {
  const [workoutType, setWorkoutType] = useState<'gym' | 'walk' | 'cardio' | 'rest' | 'other'>('gym')
  const [duration, setDuration] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await logWorkout({
      workout_type: workoutType,
      duration_minutes: duration ? Number(duration) : undefined,
      muscle_group: muscleGroup || undefined,
      notes: notes || undefined
    })

    setLoading(false)

    if (result.success) {
      // Reset optional fields
      setDuration('')
      setMuscleGroup('')
      setNotes('')
      onSuccess?.()
    }
  }

  const workoutOptions = [
    { type: 'gym' as const, icon: '🏋️', label: 'Gym' },
    { type: 'walk' as const, icon: '🚶', label: 'Walk' },
    { type: 'cardio' as const, icon: '🏃', label: 'Cardio' },
    { type: 'rest' as const, icon: '😴', label: 'Rest' },
    { type: 'other' as const, icon: '💪', label: 'Other' }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Workout Type Grid */}
      <div className="grid grid-cols-3 gap-2">
        {workoutOptions.map(({ type, icon, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => setWorkoutType(type)}
            className={`py-3 px-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all border ${
              workoutType === type
                ? 'bg-primary/10 border-primary/50 text-primary'
                : 'glass-card border-white/10 text-slate-500 hover:text-white hover:border-white/20'
            }`}
          >
            <div className="text-2xl mb-1">{icon}</div>
            {label}
          </button>
        ))}
      </div>

      {/* Duration (optional) */}
      <div className="relative">
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Duration (optional)"
          className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder:text-slate-600 placeholder:font-normal focus:outline-none focus:border-primary/50 transition-colors"
          min="0"
          step="1"
        />
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">min</span>
      </div>

      {/* Muscle Group (optional) */}
      {workoutType === 'gym' && (
        <input
          type="text"
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          placeholder="Muscle group (e.g., chest, legs)"
          className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder:text-slate-600 placeholder:font-normal focus:outline-none focus:border-primary/50 transition-colors"
        />
      )}

      {/* Notes (optional) */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={3}
        className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder:text-slate-600 placeholder:font-normal focus:outline-none focus:border-primary/50 transition-colors resize-none"
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 active:bg-primary text-charcoal font-black uppercase tracking-widest py-4 rounded-2xl shadow-neon transition-all disabled:opacity-50"
      >
        {loading ? 'Logging...' : 'Log Workout'}
      </button>
    </form>
  )
}
