'use client'

import { useState } from 'react'
import { upsertBodyProfile } from '@/app/actions/body-profile'
import { cmToFeetInches, feetInchesToCm, kgToLbs, lbsToKg } from '@/lib/unit-conversions'
import { Database } from '@/types/database.types'

type BodyProfile = Database['public']['Tables']['body_profiles']['Row']

interface BodyProfileFormProps {
  initialProfile?: BodyProfile | null
  onSuccess?: () => void
}

export function BodyProfileForm({ initialProfile, onSuccess }: BodyProfileFormProps) {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(
    initialProfile?.unit_preference as 'metric' | 'imperial'|| 'metric'
  )
  
  // Metric states
  const [heightCm, setHeightCm] = useState(initialProfile?.height_cm || 170)
  const [weightKg, setWeightKg] = useState(initialProfile?.current_weight_kg || 70)
  const [waistCm, setWaistCm] = useState(initialProfile?.waist_cm || undefined)
  const [chestCm, setChestCm] = useState(initialProfile?.chest_cm || undefined)
  const [armsCm, setArmsCm] = useState(initialProfile?.arms_cm || undefined)
  
  // Imperial states (calculated from metric)
  const { feet: heightFeet, inches: heightInches } = cmToFeetInches(heightCm)
  const weightLbs = kgToLbs(weightKg)
  const waistIn = waistCm ? waistCm / 2.54 : undefined
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const result = await upsertBodyProfile({
      height_cm: heightCm,
      current_weight_kg: weightKg,
      waist_cm: waistCm || undefined,
      chest_cm: chestCm || undefined,
      arms_cm: armsCm || undefined,
      unit_preference: unitSystem
    })

    setLoading(false)

    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      onSuccess?.()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const handleHeightChange = (value: number, unit: 'cm' | 'ft' | 'in', ftValue?: number) => {
    if (unit === 'cm') {
      setHeightCm(value)
    } else if (unit === 'ft' && ftValue !== undefined) {
      setHeightCm(feetInchesToCm(value, ftValue))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Unit Toggle */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
        <button
          type="button"
          onClick={() => setUnitSystem('metric')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
            unitSystem === 'metric'
              ? 'bg-primary text-charcoal shadow-neon'
              : 'text-slate-500 hover:text-white'
          }`}
        >
          Metric
        </button>
        <button
          type="button"
          onClick={() => setUnitSystem('imperial')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
            unitSystem === 'imperial'
              ? 'bg-primary text-charcoal shadow-neon'
              : 'text-slate-500 hover:text-white'
          }`}
        >
          Imperial
        </button>
      </div>

      {/* Height */}
      <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
          Height
        </label>
        {unitSystem === 'metric' ? (
          <div className="relative">
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-primary/50 transition-colors"
              min="100"
              max="250"
              step="0.1"
              required
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">cm</span>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                value={heightFeet}
                onChange={(e) => handleHeightChange(Number(e.target.value), 'ft', heightInches)}
                className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-primary/50 transition-colors"
                min="3"
                max="8"
                required
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">ft</span>
            </div>
            <div className="relative flex-1">
              <input
                type="number"
                value={heightInches}
                onChange={(e) => handleHeightChange(heightFeet, 'ft', Number(e.target.value))}
                className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-primary/50 transition-colors"
                min="0"
                max="11"
                required
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">in</span>
            </div>
          </div>
        )}
      </div>

      {/* Weight */}
      <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
          Current Weight
        </label>
        <div className="relative">
          <input
            type="number"
            value={unitSystem === 'metric' ? weightKg.toFixed(1) : weightLbs.toFixed(1)}
            onChange={(e) => {
              const val = Number(e.target.value)
              setWeightKg(unitSystem === 'metric' ? val : lbsToKg(val))
            }}
            className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-primary/50 transition-colors"
            min={unitSystem === 'metric' ? '30' : '66'}
            max={unitSystem === 'metric' ? '300' : '660'}
            step="0.1"
            required
          />
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">
            {unitSystem === 'metric' ? 'kg' : 'lbs'}
          </span>
        </div>
      </div>

      {/* Optional Measurements */}
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
          Optional Measurements
        </p>
        
        {/* Waist */}
        <div className="relative">
          <input
            type="number"
            value={waistCm || ''}
            onChange={(e) => setWaistCm(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={`Waist ${unitSystem === 'metric' ? '(cm)' : '(in)'}`}
            className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder:text-slate-600 placeholder:font-normal focus:outline-none focus:border-primary/50 transition-colors"
            min="50"
            max="200"
            step="0.1"
          />
        </div>

        {/* Chest */}
        <div className="relative">
          <input
            type="number"
            value={chestCm || ''}
            onChange={(e) => setChestCm(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={`Chest ${unitSystem === 'metric' ? '(cm)' : '(in)'}`}
            className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder:text-slate-600 placeholder:font-normal focus:outline-none focus:border-primary/50 transition-colors"
            min="50"
            max="200"
            step="0.1"
          />
        </div>

        {/* Arms */}
        <div className="relative">
          <input
            type="number"
            value={armsCm || ''}
            onChange={(e) => setArmsCm(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={`Arms ${unitSystem === 'metric' ? '(cm)' : '(in)'}`}
            className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder:text-slate-600 placeholder:font-normal focus:outline-none focus:border-primary/50 transition-colors"
            min="20"
            max="100"
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 active:bg-primary text-charcoal font-black uppercase tracking-widest py-5 rounded-2xl shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : initialProfile ? 'Update Profile' : 'Create Profile'}
      </button>
    </form>
  )
}
