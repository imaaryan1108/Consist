'use client'

import { useState } from 'react'
import { setTarget } from '@/app/actions/targets'
import { suggestMacros } from '@/app/actions/macro-suggestions'
import { Database } from '@/types/database.types'

type BodyProfile = Database['public']['Tables']['body_profiles']['Row']
type Target = Database['public']['Tables']['targets']['Row']

interface TargetSetupFormProps {
  bodyProfile: BodyProfile
  existingTarget?: Target | null
  onSuccess?: () => void
}

export function TargetSetupForm({ bodyProfile, existingTarget, onSuccess }: TargetSetupFormProps) {
  const [targetWeight, setTargetWeight] = useState(existingTarget?.target_weight_kg.toString() || '')
  const [targetDate, setTargetDate] = useState(existingTarget?.target_date || '')
  const [targetCalories, setTargetCalories] = useState(existingTarget?.target_calories_daily?.toString() || '')
  const [targetProtein, setTargetProtein] = useState(existingTarget?.target_protein_g_daily?.toString() || '')
  const [targetCarbs, setTargetCarbs] = useState(existingTarget?.target_carbs_g_daily?.toString() || '')
  const [targetFats, setTargetFats] = useState(existingTarget?.target_fats_g_daily?.toString() || '')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMessage, setAiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const canSuggest = targetWeight && targetDate && bodyProfile.current_weight_kg

  async function handleAISuggest() {
    if (!canSuggest) return
    setAiLoading(true)
    setAiMessage(null)

    const result = await suggestMacros({
      currentWeightKg: bodyProfile.current_weight_kg,
      targetWeightKg: parseFloat(targetWeight),
      targetDate,
      heightCm: bodyProfile.height_cm ?? undefined,
    })

    setAiLoading(false)

    if (result.success && result.data) {
      setTargetCalories(result.data.calories.toString())
      setTargetProtein(result.data.protein_g.toString())
      setTargetCarbs(result.data.carbs_g.toString())
      setTargetFats(result.data.fats_g.toString())
      setAiMessage({ type: 'success', text: result.data.explanation })
    } else {
      setAiMessage({ type: 'error', text: result.message || 'Could not generate suggestions.' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await setTarget({
        target_weight_kg: parseFloat(targetWeight),
        target_date: targetDate,
        target_calories_daily: targetCalories ? parseInt(targetCalories) : undefined,
        target_protein_g_daily: targetProtein ? parseFloat(targetProtein) : undefined,
        target_carbs_g_daily: targetCarbs ? parseFloat(targetCarbs) : undefined,
        target_fats_g_daily: targetFats ? parseFloat(targetFats) : undefined,
      })

      if (result.success) {
        setMessage('✅ Target set successfully!')
        setTimeout(() => { onSuccess?.() }, 1000)
      } else {
        setMessage(`❌ ${result.message}`)
      }
    } catch (error) {
      setMessage('❌ Failed to set target')
    } finally {
      setLoading(false)
    }
  }

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
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-3 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* AI Suggest Button — shows once target weight + date are filled */}
      {canSuggest && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleAISuggest}
            disabled={aiLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary/20 to-violet-500/20 border border-primary/30 hover:border-primary/50 text-primary font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {aiLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Calculating macros...
              </>
            ) : (
              <>
                <span className="text-base">✨</span>
                AI Suggest Daily Macros
              </>
            )}
          </button>

          {aiMessage && (
            <div className={`px-4 py-2 rounded-xl text-xs font-medium ${
              aiMessage.type === 'success'
                ? 'bg-primary/10 border border-primary/20 text-primary'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {aiMessage.text}
            </div>
          )}
        </div>
      )}

      {/* Macro Goals */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Daily Macro Goals</p>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-2">
            <span>🔥</span> Calories
          </label>
          <input
            type="number"
            value={targetCalories}
            onChange={(e) => setTargetCalories(e.target.value)}
            placeholder="2000"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors placeholder:text-slate-700"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              🥩
            </label>
            <input
              type="number" step="0.1" value={targetProtein}
              onChange={(e) => setTargetProtein(e.target.value)}
              placeholder="150"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors placeholder:text-slate-700 text-sm"
            />
            <p className="text-[10px] text-slate-600 mt-1">Protein (g)</p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              🍚
            </label>
            <input
              type="number" step="0.1" value={targetCarbs}
              onChange={(e) => setTargetCarbs(e.target.value)}
              placeholder="200"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors placeholder:text-slate-700 text-sm"
            />
            <p className="text-[10px] text-slate-600 mt-1">Carbs (g)</p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              🥑
            </label>
            <input
              type="number" step="0.1" value={targetFats}
              onChange={(e) => setTargetFats(e.target.value)}
              placeholder="60"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors placeholder:text-slate-700 text-sm"
            />
            <p className="text-[10px] text-slate-600 mt-1">Fats (g)</p>
          </div>
        </div>
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
