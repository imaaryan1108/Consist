'use client'

import { useState } from 'react'
import { logMeal } from '@/app/actions/meals'
import { analyzeNutrition } from '@/app/actions/nutrition'

interface MealLoggerProps {
  onSuccess?: () => void
}

export function MealLogger({ onSuccess }: MealLoggerProps) {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fats, setFats] = useState('')
  const [water, setWater] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzingAI, setAnalyzingAI] = useState(false)
  const [aiMessage, setAiMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleAIAnalysis = async () => {
    if (!foodName.trim()) {
      setAiMessage({ type: 'error', text: 'Please enter a food name first' })
      setTimeout(() => setAiMessage(null), 3000)
      return
    }

    setAnalyzingAI(true)
    setAiMessage(null)

    try {
      const result = await analyzeNutrition(foodName)
      
      if (result.success && result.data) {
        // Auto-fill the form with AI data
        setCalories(result.data.calories.toString())
        setProtein(result.data.protein_g.toFixed(1))
        setCarbs(result.data.carbs_g.toFixed(1))
        setFats(result.data.fats_g.toFixed(1))
        
        // Show success message with serving size info
        const servingInfo = result.data.serving_size ? ` (${result.data.serving_size})` : ''
        setAiMessage({ 
          type: 'success', 
          text: `✨ Nutrition data filled${servingInfo}` 
        })
        setTimeout(() => setAiMessage(null), 5000)
      } else {
        setAiMessage({ 
          type: 'error', 
          text: result.message || 'Could not analyze food. Please enter values manually.' 
        })
        setTimeout(() => setAiMessage(null), 5000)
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      setAiMessage({ 
        type: 'error', 
        text: 'AI analysis failed. Please enter values manually.' 
      })
      setTimeout(() => setAiMessage(null), 5000)
    } finally {
      setAnalyzingAI(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await logMeal({
      meal_type: mealType,
      food_name: foodName,
      calories: Number(calories),
      protein_g: protein ? Number(protein) : undefined,
      carbs_g: carbs ? Number(carbs) : undefined,
      fats_g: fats ? Number(fats) : undefined,
      water_ml: water ? Number(water) : undefined
    })

    setLoading(false)

    if (result.success) {
      // Reset form
      setFoodName('')
      setCalories('')
      setProtein('')
      setCarbs('')
      setFats('')
      setWater('')
      onSuccess?.()
    }
  }

  const mealIcons = {
    breakfast: '🍳',
    lunch: '🥗',
    dinner: '🍽️',
    snack: '🍎'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Meal Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(Object.keys(mealIcons) as Array<keyof typeof mealIcons>).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setMealType(type)}
            className={`py-3 px-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all border ${
              mealType === type
                ? 'bg-primary/10 border-primary/50 text-primary'
                : 'glass-card border-white/10 text-slate-500 hover:text-white hover:border-white/20'
            }`}
          >
            <div className="text-lg mb-1">{mealIcons[type]}</div>
            {type}
          </button>
        ))}
      </div>

      {/* Food Name with AI Assist */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder="What did you eat?"
            className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder:text-slate-600 placeholder:font-normal focus:outline-none focus:border-primary/50 transition-colors"
            required
          />
          <button
            type="button"
            onClick={handleAIAnalysis}
            disabled={analyzingAI || !foodName.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/20 to-violet-500/20 border border-primary/30 hover:border-primary/50 text-primary font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {analyzingAI ? (
              <>
                <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span className="text-base">✨</span>
                <span>AI Assist</span>
              </>
            )}
          </button>
        </div>
        
        {/* AI Feedback Message */}
        {aiMessage && (
          <div 
            className={`px-4 py-2 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${
              aiMessage.type === 'success' 
                ? 'bg-primary/10 border border-primary/30 text-primary' 
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {aiMessage.text}
          </div>
        )}
      </div>


      {/* Calories (required) */}
      <div className="relative">
        <input
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="Calories"
          className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder:text-slate-600 placeholder:font-normal focus:outline-none focus:border-primary/50 transition-colors"
          min="0"
          step="1"
          required
        />
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">kcal</span>
      </div>

      {/* Macros Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Protein */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🥩</div>
          <input
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="Protein"
            className="w-full glass-card border border-white/10 rounded-2xl pl-12 pr-10 py-3 text-white font-bold placeholder:text-slate-600 placeholder:font-normal text-sm focus:outline-none focus:border-primary/50 transition-colors"
            min="0"
            step="0.1"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs">g</span>
        </div>

        {/* Carbs */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🍚</div>
          <input
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder="Carbs"
            className="w-full glass-card border border-white/10 rounded-2xl pl-12 pr-10 py-3 text-white font-bold placeholder:text-slate-600 placeholder:font-normal text-sm focus:outline-none focus:border-primary/50 transition-colors"
            min="0"
            step="0.1"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs">g</span>
        </div>

        {/* Fats */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🥑</div>
          <input
            type="number"
            value={fats}
            onChange={(e) => setFats(e.target.value)}
            placeholder="Fats"
            className="w-full glass-card border border-white/10 rounded-2xl pl-12 pr-10 py-3 text-white font-bold placeholder:text-slate-600 placeholder:font-normal text-sm focus:outline-none focus:border-primary/50 transition-colors"
            min="0"
            step="0.1"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs">g</span>
        </div>

        {/* Water */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">💧</div>
          <input
            type="number"
            value={water}
            onChange={(e) => setWater(e.target.value)}
            placeholder="Water"
            className="w-full glass-card border border-white/10 rounded-2xl pl-12 pr-10 py-3 text-white font-bold placeholder:text-slate-600 placeholder:font-normal text-sm focus:outline-none focus:border-primary/50 transition-colors"
            min="0"
            step="50"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs">ml</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 active:bg-primary text-charcoal font-black uppercase tracking-widest py-4 rounded-2xl shadow-neon transition-all disabled:opacity-50"
      >
        {loading ? 'Logging...' : `Log ${mealType}`}
      </button>
    </form>
  )
}
