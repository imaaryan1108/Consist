import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Initialize Gemini AI client
 * Uses the free tier model: gemini-1.5-flash
 */
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables')
  }
  
  return new GoogleGenerativeAI(apiKey)
}

/**
 * Get the Gemini model instance
 * Using gemini-2.0-flash-exp which is the latest experimental flash model
 */
export function getGeminiModel() {
  const genAI = getGeminiClient()
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
}
