'use server'

import { getGeminiModel } from '@/lib/ai/gemini'

export interface MacroSuggestion {
  calories: number
  protein_g: number
  carbs_g: number
  fats_g: number
  explanation: string
}

export interface MacroSuggestionResult {
  success: boolean
  data?: MacroSuggestion
  message?: string
}

export async function suggestMacros({
  currentWeightKg,
  targetWeightKg,
  targetDate,
  heightCm,
}: {
  currentWeightKg: number
  targetWeightKg: number
  targetDate: string
  heightCm?: number
}): Promise<MacroSuggestionResult> {
  try {
    const today = new Date()
    const target = new Date(targetDate)
    const daysRemaining = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const weightDiffKg = targetWeightKg - currentWeightKg
    const direction = weightDiffKg < 0 ? 'lose' : weightDiffKg > 0 ? 'gain' : 'maintain'

    const model = getGeminiModel()

    const prompt = `You are a sports nutritionist. Calculate daily macro goals for this person:

- Current weight: ${currentWeightKg} kg
- Target weight: ${targetWeightKg} kg
- Days to reach target: ${daysRemaining} days
- Goal: ${direction} ${Math.abs(weightDiffKg).toFixed(1)} kg
${heightCm ? `- Height: ${heightCm} cm` : ''}

Assume moderate activity level (gym 4-5x per week, consistent training).

Return ONLY valid JSON, no markdown:
{
  "calories": <daily target calories as integer>,
  "protein_g": <daily protein in grams as integer>,
  "carbs_g": <daily carbs in grams as integer>,
  "fats_g": <daily fats in grams as integer>,
  "explanation": "<one sentence explaining the approach>"
}`

    const result = await model.generateContent(prompt)
    let text = result.response.text().trim()

    if (text.startsWith('```')) {
      text = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim()
    }

    const data: MacroSuggestion = JSON.parse(text)

    if (
      typeof data.calories !== 'number' ||
      typeof data.protein_g !== 'number' ||
      typeof data.carbs_g !== 'number' ||
      typeof data.fats_g !== 'number'
    ) {
      return { success: false, message: 'Invalid response from AI' }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('suggestMacros error:', error)
    return { success: false, message: 'Could not generate suggestions. Try again.' }
  }
}
