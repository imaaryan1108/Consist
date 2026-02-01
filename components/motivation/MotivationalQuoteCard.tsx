'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getDailyQuote, type MotivationalQuote } from '@/lib/motivation/quotes'

export function MotivationalQuoteCard() {
  const [quote, setQuote] = useState<MotivationalQuote | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const dailyQuote = getDailyQuote()
    setQuote(dailyQuote)
    
    // Fade in after mount
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  if (!quote) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="glass-card border border-primary/20 rounded-3xl p-6 relative overflow-hidden"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            {/* Quote icon */}
            <div className="text-4xl mb-3 text-primary/60">❝</div>
            
            {/* Quote text */}
            <p className="text-white font-bold text-lg leading-relaxed mb-4 italic">
              {quote.text}
            </p>
            
            {/* Author */}
            {quote.author && (
              <p className="text-slate-500 text-sm font-bold">
                — {quote.author}
              </p>
            )}
            
            {/* Category badge */}
            <div className="mt-4 inline-block">
              <span className="text-[10px] font-black text-primary/80 uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
                {quote.category.replace('-', ' ')}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
