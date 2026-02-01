'use client'

import { useState } from 'react'
import { submitWeeklyCheckin } from '@/app/actions/weekly-checkin'
import { Database } from '@/types/database.types'

type BodyProfile = Database['public']['Tables']['body_profiles']['Row']

interface WeeklyCheckinModalProps {
  bodyProfile: BodyProfile
  onClose: () => void
  onSuccess?: () => void
}

export function WeeklyCheckinModal({ bodyProfile, onClose, onSuccess }: WeeklyCheckinModalProps) {
  const [weight, setWeight] = useState(bodyProfile.current_weight_kg.toString())
  const [waist, setWaist] = useState(bodyProfile.waist_cm?.toString() || '')
  const [chest, setChest] = useState(bodyProfile.chest_cm?.toString() || '')
  const [arms, setArms] = useState(bodyProfile.arms_cm?.toString() || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const result = await submitWeeklyCheckin({
      weight_kg: Number(weight),
      waist_cm: waist ? Number(waist) : undefined,
      chest_cm: chest ? Number(chest) : undefined,
      arms_cm: arms ? Number(arms) : undefined
    })

    setLoading(false)

    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: result.weight_change_kg 
          ? `Check-in complete! ${result.weight_change_kg > 0 ? '+' : ''}${result.weight_change_kg.toFixed(1)}kg vs last week`
          : 'Check-in complete!'
      })
      
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card border border-white/20 rounded-[2rem] p-6 max-w-md w-full relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
        >
          <span className="text-2xl">×</span>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📊</div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            Weekly Check-In
          </h2>
          <p className="text-slate-500 text-xs font-bold mt-2">
            Track your progress week by week
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Weight (required) */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
              Current Weight *
            </label>
            <div className="relative">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-primary/50 transition-colors"
                step="0.1"
                required
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">kg</span>
            </div>
          </div>

          {/* Optional Measurements */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
              Optional Measurements
            </p>
            
            <div className="relative">
              <input
                type="number"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                placeholder="Waist (cm)"
                className="w-full glass-card border border-white/10 rounded-2xl px-4 py-3 text-white font-bold placeholder:text-slate-600 placeholder:font-normal focus:outline-none focus:border-primary/50 transition-colors"
                step="0.1"
              />
            </div>

            <div className="relative">
              <input
                type="number"
                value={chest}
                onChange={(e) => setChest(e.target.value)}
                placeholder="Chest (cm)"
                className="w-full glass-card border border-white/10 rounded-2xl px-4 py-3 text-white font-bold placeholder:text-slate-600 placeholder:font-normal focus:outline-none focus:border-primary/50 transition-colors"
                step="0.1"
              />
            </div>

            <div className="relative">
              <input
                type="number"
                value={arms}
                onChange={(e) => setArms(e.target.value)}
                placeholder="Arms (cm)"
                className="w-full glass-card border border-white/10 rounded-2xl px-4 py-3 text-white font-bold placeholder:text-slate-600 placeholder:font-normal focus:outline-none focus:border-primary/50 transition-colors"
                step="0.1"
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-2xl border ${
              message.type === 'success' 
                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <p className="text-sm font-bold">{message.text}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 glass-card border border-white/10 hover:border-white/20 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90 text-charcoal font-black uppercase tracking-widest py-4 rounded-2xl shadow-neon transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
