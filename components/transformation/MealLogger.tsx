'use client'

import { useState } from 'react'
import { logMeal } from '@/app/actions/meals'

interface MealLoggerProps {
  onSuccess?: () => void
}

export function MealLogger({ onSuccess }: MealLoggerProps) {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [water, setWater] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await logMeal({
      meal_type: mealType,
      food_name: foodName,
      calories: Number(calories),
      protein_g: protein ? Number(protein) : undefined,
      water_ml: water ? Number(water) : undefined
    })

    setLoading(false)

    if (result.success) {
      // Reset form
      setFoodName('')
      setCalories('')
      setProtein('')
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

      {/* Food Name */}
      <input
        type="text"
        value={foodName}
        onChange={(e) => setFoodName(e.target.value)}
        placeholder="What did you eat?"
        className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder:text-slate-600 placeholder:font-normal focus:outline-none focus:border-primary/50 transition-colors"
        required
      />

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

      {/* Optional: Protein & Water */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <input
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="Protein (optional)"
            className="w-full glass-card border border-white/10 rounded-2xl px-4 py-3 text-white font-bold placeholder:text-slate-600 placeholder:font-normal text-sm focus:outline-none focus:border-primary/50 transition-colors"
            min="0"
            step="0.1"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs">g</span>
        </div>

        <div className="relative">
          <input
            type="number"
            value={water}
            onChange={(e) => setWater(e.target.value)}
            placeholder="Water (optional)"
            className="w-full glass-card border border-white/10 rounded-2xl px-4 py-3 text-white font-bold placeholder:text-slate-600 placeholder:font-normal text-sm focus:outline-none focus:border-primary/50 transition-colors"
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
