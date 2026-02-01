'use client'

import { useState } from 'react'
import { setTarget } from '@/app/actions/targets'
import { Database } from '@/types/database.types'

type BodyProfile = Database['public']['Tables']['body_profiles']['Row']

interface TargetSetupFormProps {
  bodyProfile: BodyProfile
  onSuccess?: () => void
}

export function TargetSetupForm({ bodyProfile, onSuccess }: TargetSetupFormProps) {
  const [targetWeight, setTargetWeight] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await setTarget({
        target_weight_kg: parseFloat(targetWeight),
        target_date: targetDate
      })

      if (result.success) {
        setMessage('✅ Target set successfully!')
        setTimeout(() => {
          onSuccess?.()
        }, 1000)
      } else {
        setMessage(`❌ ${result.message}`)
      }
    } catch (error) {
      setMessage('❌ Failed to set target')
    } finally {
      setLoading(false)
    }
  }

  // Calculate minimum date (tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">
          Target Weight (kg)
        </label>
        <input
          type="number"
          step="0.1"
          value={targetWeight}
          onChange={(e) => setTargetWeight(e.target.value)}
          placeholder="65.0"
          required
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
        />
        <p className="text-xs text-slate-600 mt-1">
          Current: {bodyProfile.current_weight_kg.toFixed(1)} kg
        </p>
      </div>

      <div>
        <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">
          Target Date
        </label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          min={minDate}
          required
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 text-charcoal font-black py-3 rounded-2xl uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Setting...' : 'Set Goal'}
      </button>

      {message && (
        <div className={`p-4 rounded-2xl text-center text-sm font-bold ${
          message.includes('✅') 
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message}
        </div>
      )}
    </form>
  )
}
