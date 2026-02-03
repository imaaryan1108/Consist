'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Affirmation message categories
const AFFIRMATIONS = {
  calming: [
    "Take a deep breath... hold... release 🌬️",
    "Breathe in strength. Exhale doubt.",
    "Center yourself. You're exactly where you need to be.",
    "Inhale confidence. Exhale fear.",
    "Ground yourself in this moment ⚡",
    "Feel your breath. Feel your power.",
    "Slow down. Your mind is settling.",
    "One breath at a time. One rep at a time.",
  ],
  visualization: [
    "Visualize your best self 💭",
    "See yourself crushing today's goals",
    "Picture the transformation happening now",
    "Imagine the version of you 90 days from now",
    "Your future self is rooting for you",
    "Close your eyes. See the victory.",
    "What does your strongest form look like?",
    "Envision the grind paying off 🎯",
  ],
  gritty: [
    "Patience builds monsters 👹",
    "Good things take time. Greatness takes longer.",
    "Loading your power-up... ⚡",
    "Rome wasn't built in a day. Neither are abs.",
    "Your consistency is loading... 🔥",
    "Buffering excellence...",
    "The grind never sleeps, but it does load.",
    "Forging steel takes heat and time 🔨",
    "Champions wait well.",
    "This is the easy part. The real work is the work.",
    "Syncing your future gains...",
    "Calibrating your comeback...",
  ],
  technical: [
    "Syncing your data...",
    "Preparing your dashboard...",
    "Loading your circle...",
    "Just a moment...",
  ]
}

// Flatten all messages into a single array
const ALL_MESSAGES = [
  ...AFFIRMATIONS.calming,
  ...AFFIRMATIONS.visualization,
  ...AFFIRMATIONS.gritty,
  ...AFFIRMATIONS.technical,
]

interface LoadingStateProps {
  variant?: 'full' | 'inline' | 'minimal'
  message?: string
  showIcon?: boolean
}

export function LoadingState({ 
  variant = 'inline', 
  message,
  showIcon = true 
}: LoadingStateProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [displayMessage, setDisplayMessage] = useState(
    message || ALL_MESSAGES[Math.floor(Math.random() * ALL_MESSAGES.length)]
  )

  useEffect(() => {
    if (message) {
      setDisplayMessage(message)
      return
    }

    // Rotate messages every 3.5 seconds
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        const next = (prev + 1) % ALL_MESSAGES.length
        setDisplayMessage(ALL_MESSAGES[next])
        return next
      })
    }, 3500)

    return () => clearInterval(interval)
  }, [message])

  // Full-page variant
  if (variant === 'full') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal p-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        
        <div className="relative z-10 flex flex-col items-center justify-center gap-6 max-w-md w-full">
          {showIcon && (
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center"
            >
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </motion.div>
          )}
          
          <div className="text-center space-y-3">
            <AnimatePresence mode="wait">
              <motion.p
                key={displayMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-sm font-bold text-white/90 tracking-wide"
              >
                {displayMessage}
              </motion.p>
            </AnimatePresence>
            
            <div className="flex gap-1 justify-center">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Inline variant (for within sections)
  if (variant === 'inline') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        {showIcon && (
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="w-10 h-10 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center"
          >
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full" />
          </motion.div>
        )}
        
        <AnimatePresence mode="wait">
          <motion.p
            key={displayMessage}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.4 }}
            className="text-xs font-bold text-slate-400 tracking-wide text-center max-w-xs"
          >
            {displayMessage}
          </motion.p>
        </AnimatePresence>
      </div>
    )
  }

  // Minimal variant (compact)
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      {showIcon && (
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      )}
      <AnimatePresence mode="wait">
        <motion.p
          key={displayMessage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500"
        >
          {displayMessage}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
