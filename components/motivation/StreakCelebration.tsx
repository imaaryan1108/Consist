'use client'

import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

interface StreakCelebrationProps {
  streak: number
  showCelebration?: boolean
}

export function StreakCelebration({ streak, showCelebration = false }: StreakCelebrationProps) {
  useEffect(() => {
    if (showCelebration) {
      // Trigger confetti
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#BBF7D0', '#4ADE80', '#22C55E']
        })
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#BBF7D0', '#4ADE80', '#22C55E']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()
    }
  }, [showCelebration])

  // Milestone messages
  const getMilestoneMessage = () => {
    if (streak === 1) return "Day 1 complete! 🌱"
    if (streak === 3) return "3 days strong! 💪"
    if (streak === 7) return "One week! You're building a habit! 🔥"
    if (streak === 14) return "Two weeks! This is becoming you! 🚀"
    if (streak === 21) return "21 days! Habit formed! 🎯"
    if (streak === 30) return "One month! Unstoppable! ⚡"
    if (streak === 60) return "60 days! You're a machine! 🦾"
    if (streak === 90) return "90 days! Complete transformation! 🌟"
    if (streak === 100) return "100 days! LEGENDARY! 👑"
    
    if (streak % 10 === 0) return `${streak} days! Keep going! 🔥`
    
    return `Day ${streak}! Getting closer! 🎯`
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 260,
        damping: 20
      }}
      className="glass-card border border-primary/30 rounded-3xl p-6 text-center relative overflow-hidden"
    >
      {/* Shimmer background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-green-500/10 to-primary/10 animate-shimmer" />
      
      <div className="relative z-10">
        {/* Streak number */}
        <motion.div
          animate={{ 
            rotate: showCelebration ? [0, -5, 5, -5, 5, 0] : 0,
            scale: showCelebration ? [1, 1.1, 1] : 1
          }}
          transition={{ duration: 0.5 }}
          className="mb-3"
        >
          <div className="text-6xl font-black text-primary mb-2">
            {streak}
          </div>
          <div className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Day Streak 🔥
          </div>
        </motion.div>

        {/* Milestone message */}
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-bold text-white mb-2"
        >
          {getMilestoneMessage()}
        </motion.p>

        <p className="text-sm text-slate-400 font-bold italic">
          Don't break the chain!
        </p>

        {/* Streak visualization */}
        <div className="mt-4 flex justify-center gap-1">
          {[...Array(Math.min(streak, 10))].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="w-2 h-6 bg-gradient-to-t from-primary to-green-400 rounded-full"
            />
          ))}
          {streak > 10 && (
            <div className="text-primary font-black text-sm ml-1">
              +{streak - 10}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
