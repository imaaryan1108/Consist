'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { logMeal } from '@/app/actions/meals'
import { analyzeNutrition } from '@/app/actions/nutrition'
import { analyzeNutritionFromImage } from '@/app/actions/nutrition-image'
import { track } from '@/lib/analytics/analytics'
import { haptic } from '@/lib/utils/haptic'

interface MealLoggerProps {
  onSuccess?: () => void
}

type AIMode = 'text' | 'photo' | 'voice'
type AIStatus = 'idle' | 'listening' | 'analyzing' | 'done' | 'error'

export function MealLogger({ onSuccess }: MealLoggerProps) {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fats, setFats] = useState('')
  const [water, setWater] = useState('')
  const [loading, setLoading] = useState(false)

  const [aiMode, setAiMode] = useState<AIMode>('text')
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle')
  const [aiMessage, setAiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [voiceTranscript, setVoiceTranscript] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setAiMessage({ type, text })
    setTimeout(() => setAiMessage(null), 5000)
  }

  const fillForm = (data: any, label: string) => {
    setFoodName(label)
    setCalories(data.calories.toString())
    setProtein(data.protein_g.toFixed(1))
    setCarbs(data.carbs_g.toFixed(1))
    setFats(data.fats_g.toFixed(1))
    const serving = data.serving_size ? ` (${data.serving_size})` : ''
    showMessage('success', `✨ Filled${serving}${data.confidence === 'low' ? ' — low confidence, please verify' : ''}`)
    setAiStatus('done')
    haptic('success')
  }

  // ── Text mode ────────────────────────────────────────
  const handleTextAnalysis = async () => {
    if (!foodName.trim()) return
    setAiStatus('analyzing')
    setAiMessage(null)
    const result = await analyzeNutrition(foodName)
    track.aiAssistUsed({ food_name: foodName, success: !!result.success })
    if (result.success && result.data) {
      fillForm(result.data, foodName)
    } else {
      setAiStatus('error')
      showMessage('error', result.message || 'Could not analyze. Enter manually.')
    }
  }

  // ── Photo mode ────────────────────────────────────────
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const dataUrl = reader.result as string
      setImagePreview(dataUrl)
      setAiStatus('analyzing')
      setAiMessage(null)

      // Strip data URL prefix → pure base64
      const base64 = dataUrl.split(',')[1]
      const result = await analyzeNutritionFromImage(base64, file.type)
      track.aiAssistUsed({ food_name: 'photo', success: !!result.success })

      if (result.success && result.data) {
        fillForm(result.data, result.message || 'Photo meal')
      } else {
        setAiStatus('error')
        showMessage('error', result.message || 'Could not read image. Try again.')
      }
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  // ── Voice mode ────────────────────────────────────────
  const startVoice = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      showMessage('error', 'Voice not supported in this browser')
      return
    }

    haptic('medium')
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onstart = () => setAiStatus('listening')

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('')
      setVoiceTranscript(transcript)
    }

    recognition.onend = async () => {
      const final = voiceTranscript || recognitionRef.current?._lastTranscript
      if (!final?.trim()) {
        setAiStatus('idle')
        return
      }
      setAiStatus('analyzing')
      setFoodName(final)
      const result = await analyzeNutrition(final)
      track.aiAssistUsed({ food_name: final, success: !!result.success })
      if (result.success && result.data) {
        fillForm(result.data, final)
      } else {
        setAiStatus('error')
        showMessage('error', result.message || 'Could not analyze. Try again.')
      }
      setVoiceTranscript('')
    }

    recognition.onerror = () => {
      setAiStatus('error')
      showMessage('error', 'Microphone error. Check permissions.')
      setVoiceTranscript('')
    }

    recognition.start()
  }, [voiceTranscript])

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  // ── Submit ─────────────────────────────────────────────
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
      water_ml: water ? Number(water) : undefined,
    })
    setLoading(false)
    if (result.success) {
      track.mealLogged({ meal_type: mealType, calories: Number(calories), used_ai_assist: !!protein && !!carbs && !!fats, has_macros: !!(protein || carbs || fats) })
      haptic('success')
      setFoodName(''); setCalories(''); setProtein(''); setCarbs(''); setFats(''); setWater('')
      setImagePreview(null); setAiStatus('idle')
      onSuccess?.()
    }
  }

  const mealIcons = { breakfast: '🍳', lunch: '🥗', dinner: '🍽️', snack: '🍎' }
  const isAnalyzing = aiStatus === 'analyzing'
  const isListening = aiStatus === 'listening'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Meal Type */}
      <div className="grid grid-cols-4 gap-2">
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

      {/* AI Input Modes */}
      <div className="glass-card border border-white/10 rounded-2xl overflow-hidden">
        {/* Mode tabs */}
        <div className="grid grid-cols-3 border-b border-white/5">
          {([
            { mode: 'text' as AIMode, icon: '⌨️', label: 'Type' },
            { mode: 'photo' as AIMode, icon: '📷', label: 'Photo' },
            { mode: 'voice' as AIMode, icon: '🎤', label: 'Voice' },
          ]).map(({ mode, icon, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => { setAiMode(mode); setAiStatus('idle'); setImagePreview(null); setVoiceTranscript('') }}
              className={`py-3 flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                aiMode === mode
                  ? 'bg-primary/10 text-primary border-b-2 border-primary'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="p-3">
          <AnimatePresence mode="wait">
            {/* TEXT MODE */}
            {aiMode === 'text' && (
              <motion.div
                key="text"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTextAnalysis())}
                  placeholder="e.g. 2 eggs and toast"
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder:text-slate-600 placeholder:font-normal focus:outline-none focus:border-primary/50 transition-colors text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={handleTextAnalysis}
                  disabled={isAnalyzing || !foodName.trim()}
                  className="flex-shrink-0 w-24 rounded-xl bg-gradient-to-r from-primary/20 to-violet-500/20 border border-primary/30 hover:border-primary/50 text-primary font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isAnalyzing ? (
                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <><span>✨</span><span>Analyze</span></>
                  )}
                </button>
              </motion.div>
            )}

            {/* PHOTO MODE */}
            {aiMode === 'photo' && (
              <motion.div
                key="photo"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Food preview"
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-white text-xs font-bold">Analyzing food...</p>
                      </div>
                    )}
                    {!isAnalyzing && (
                      <button
                        type="button"
                        onClick={() => { setImagePreview(null); setAiStatus('idle') }}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/80 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { haptic('light'); fileInputRef.current?.click() }}
                      className="flex flex-col items-center gap-2 py-6 bg-white/5 border border-white/10 border-dashed rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all"
                    >
                      <span className="text-3xl">📸</span>
                      <span className="text-[10px] font-black uppercase tracking-wider">Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        haptic('light')
                        if (fileInputRef.current) {
                          fileInputRef.current.removeAttribute('capture')
                          fileInputRef.current.click()
                          fileInputRef.current.setAttribute('capture', 'environment')
                        }
                      }}
                      className="flex flex-col items-center gap-2 py-6 bg-white/5 border border-white/10 border-dashed rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all"
                    >
                      <span className="text-3xl">🖼️</span>
                      <span className="text-[10px] font-black uppercase tracking-wider">Gallery</span>
                    </button>
                  </div>
                )}

                {/* Food name input for photo mode (editable after analysis) */}
                {foodName && (
                  <input
                    type="text"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="Detected food..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                    required
                  />
                )}
                {!foodName && <input type="text" value="" onChange={() => {}} className="hidden" required aria-hidden />}
              </motion.div>
            )}

            {/* VOICE MODE */}
            {aiMode === 'voice' && (
              <motion.div
                key="voice"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-3 py-2"
              >
                <motion.button
                  type="button"
                  onPointerDown={startVoice}
                  onPointerUp={stopVoice}
                  onPointerLeave={stopVoice}
                  animate={isListening ? { scale: [1, 1.08, 1], boxShadow: ['0 0 0px rgba(198,255,0,0)', '0 0 24px rgba(198,255,0,0.4)', '0 0 0px rgba(198,255,0,0)'] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className={`w-20 h-20 rounded-full border-2 flex items-center justify-center text-4xl transition-all ${
                    isListening
                      ? 'bg-primary/20 border-primary text-primary shadow-neon'
                      : isAnalyzing
                      ? 'bg-white/5 border-white/20 opacity-50 cursor-not-allowed'
                      : 'bg-white/5 border-white/20 hover:border-primary/50 hover:bg-primary/10'
                  }`}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : '🎤'}
                </motion.button>

                <p className="text-xs font-bold text-slate-500 text-center">
                  {isListening
                    ? 'Listening... release when done'
                    : isAnalyzing
                    ? 'Analyzing...'
                    : 'Hold to speak'}
                </p>

                {voiceTranscript && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-bold text-white text-center px-2"
                  >
                    "{voiceTranscript}"
                  </motion.p>
                )}

                {foodName && !isListening && !isAnalyzing && (
                  <input
                    type="text"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors text-sm text-center"
                    required
                  />
                )}
                {!foodName && <input type="text" value="" onChange={() => {}} className="hidden" required aria-hidden />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Feedback */}
      <AnimatePresence>
        {aiMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold ${
              aiMessage.type === 'success'
                ? 'bg-primary/10 border border-primary/30 text-primary'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {aiMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calories */}
      <div className="relative">
        <input
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="Calories"
          className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder:text-slate-600 placeholder:font-normal focus:outline-none focus:border-primary/50 transition-colors"
          min="0" step="1" required
        />
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">kcal</span>
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: '🥩', value: protein, set: setProtein, label: 'Protein' },
          { icon: '🍚', value: carbs, set: setCarbs, label: 'Carbs' },
          { icon: '🥑', value: fats, set: setFats, label: 'Fats' },
          { icon: '💧', value: water, set: setWater, label: 'Water', step: '50', unit: 'ml' },
        ].map(({ icon, value, set, label, step = '0.1', unit = 'g' }) => (
          <div key={label} className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">{icon}</div>
            <input
              type="number"
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={label}
              className="w-full glass-card border border-white/10 rounded-2xl pl-12 pr-10 py-3 text-white font-bold placeholder:text-slate-600 placeholder:font-normal text-sm focus:outline-none focus:border-primary/50 transition-colors"
              min="0" step={step}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs">{unit}</span>
          </div>
        ))}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] text-charcoal font-black uppercase tracking-widest py-4 rounded-2xl shadow-neon transition-all disabled:opacity-50"
      >
        {loading ? 'Logging...' : `Log ${mealType}`}
      </button>
    </form>
  )
}
