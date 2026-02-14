'use server'

import { getGeminiModel } from '@/lib/ai/gemini'

export interface NutritionData {
  calories: number
  protein_g: number
  carbs_g: number
  fats_g: number
  serving_size?: string
  confidence?: 'high' | 'medium' | 'low'
}

export interface NutritionAnalysisResult {
  success: boolean
  data?: NutritionData
  message?: string
}

/**
 * Analyze food description using Gemini AI to extract nutritional information
 */
export async function analyzeNutrition(foodDescription: string): Promise<NutritionAnalysisResult> {
  try {
    if (!foodDescription || foodDescription.trim().length === 0) {
      return {
        success: false,
        message: 'Please provide a food description'
      }
    }

    const model = getGeminiModel()
    
    const prompt = `You are a nutrition expert. Analyze the following food description and provide detailed nutritional information.

Food: ${foodDescription}

Please provide the nutritional information in the following JSON format (return ONLY valid JSON, no additional text):
{
  "calories": <number>,
  "protein_g": <number>,
  "carbs_g": <number>,
  "fats_g": <number>,
  "serving_size": "<description of serving size analyzed>",
  "confidence": "<high|medium|low>"
}

Important guidelines:
1. If a quantity is specified (e.g., "200g chicken", "2 eggs"), analyze that exact amount
2. If no quantity is specified, use a standard single serving size
3. Return reasonable estimates based on common nutritional databases (USDA, etc.)
4. Set confidence to "high" for simple, well-known foods, "medium" for common meals, "low" for complex or unusual items
5. All macro values should be in grams, calories should be a whole number
6. Return only the JSON object, no markdown formatting or additional text`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    
    // Extract JSON from response (handle cases where AI might add markdown formatting)
    let jsonText = text.trim()
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\s*/g, '').replace(/```\s*$/g, '')
    }
    
    // Parse the JSON response
    const nutritionData: NutritionData = JSON.parse(jsonText)
    
    // Validate the response
    if (
      typeof nutritionData.calories !== 'number' ||
      typeof nutritionData.protein_g !== 'number' ||
      typeof nutritionData.carbs_g !== 'number' ||
      typeof nutritionData.fats_g !== 'number'
    ) {
      return {
        success: false,
        message: 'Invalid nutrition data received from AI'
      }
    }
    
    // Validate reasonable ranges
    if (
      nutritionData.calories < 0 || nutritionData.calories > 10000 ||
      nutritionData.protein_g < 0 || nutritionData.protein_g > 1000 ||
      nutritionData.carbs_g < 0 || nutritionData.carbs_g > 1000 ||
      nutritionData.fats_g < 0 || nutritionData.fats_g > 1000
    ) {
      return {
        success: false,
        message: 'Nutrition values seem unrealistic. Please check your food description.'
      }
    }
    
    return {
      success: true,
      data: nutritionData
    }
    
  } catch (error: any) {
    console.error('Error analyzing nutrition:', error)
    
    // Handle specific error types
    if (error.message?.includes('API key')) {
      return {
        success: false,
        message: 'AI service is not configured. Please contact support.'
      }
    }
    
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return {
        success: false,
        message: 'AI service limit reached. Please try again later or enter values manually.'
      }
    }
    
    return {
      success: false,
      message: 'Could not analyze food. Please enter nutrition values manually.'
    }
  }
}
