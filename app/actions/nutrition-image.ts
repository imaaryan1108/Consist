'use server'

import { getGeminiClient } from '@/lib/ai/gemini'
import { NutritionData, NutritionAnalysisResult } from './nutrition'

export async function analyzeNutritionFromImage(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<NutritionAnalysisResult> {
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are a nutrition expert analyzing a food photo. Identify all food items visible and estimate their nutritional content.

Return ONLY valid JSON, no markdown:
{
  "food_name": "<brief description of what you see>",
  "calories": <total estimated calories as integer>,
  "protein_g": <total protein in grams as number>,
  "carbs_g": <total carbs in grams as number>,
  "fats_g": <total fats in grams as number>,
  "serving_size": "<description of estimated portion>",
  "confidence": "<high|medium|low>"
}

Guidelines:
- Estimate for the visible portion only
- If multiple items, sum the totals
- If food is unclear, set confidence to "low"
- Return realistic values based on common portion sizes`

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } },
    ])

    let text = result.response.text().trim()
    if (text.startsWith('```')) {
      text = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim()
    }

    const parsed = JSON.parse(text)

    const data: NutritionData = {
      calories: Math.round(parsed.calories),
      protein_g: parseFloat(parsed.protein_g),
      carbs_g: parseFloat(parsed.carbs_g),
      fats_g: parseFloat(parsed.fats_g),
      serving_size: parsed.serving_size,
      confidence: parsed.confidence,
    }

    return { success: true, data, message: parsed.food_name }
  } catch (err: any) {
    console.error('analyzeNutritionFromImage error:', err)
    return { success: false, message: 'Could not analyze image. Try again or enter manually.' }
  }
}
