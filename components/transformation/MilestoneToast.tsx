'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database } from '@/types/database.types'

type Milestone = Database['public']['Tables']['milestones']['Row']

interface MilestoneToastProps {
  milestones: Milestone[]
  onClose: (id: string) => void
}

export function MilestoneToast({ milestones, onClose }: MilestoneToastProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const currentMilestone = milestones[currentIndex]

  useEffect(() => {
    if (!currentMilestone) return

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [currentIndex, currentMilestone])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose(currentMilestone.id)
      
      // Show next milestone if available
      if (currentIndex < milestones.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setIsVisible(true)
      }
    }, 300)
  }

  if (!currentMilestone) return null

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'weight_milestone':
        return '🎯'
      case 'weekly_consistency':
        return '🔥'
      case 'monthly_consistency':
        return '💎'
      case 'target_achieved':
        return '🏆'
      default:
        return '⭐'
    }
  }

  const getMilestoneTitle = (type: string) => {
    switch (type) {
      case 'weight_milestone':
        return 'Weight Milestone!'
      case 'weekly_consistency':
        return 'Weekly Streak!'
      case 'monthly_consistency':
        return 'Monthly Streak!'
      case 'target_achieved':
        return 'Target Achieved!'
      default:
        return 'New Milestone!'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <div className="glass-card border-2 border-primary/50 rounded-3xl p-6 shadow-neon relative overflow-hidden">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10"
            >
              <span className="text-xl">×</span>
            </button>

            <div className="relative z-10">
              {/* Icon */}
              <div className="text-6xl mb-3 text-center animate-bounce">
                {getMilestoneIcon(currentMilestone.type)}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-black text-white text-center uppercase tracking-tight mb-2">
                {getMilestoneTitle(currentMilestone.type)}
              </h3>

              {/* Description */}
              <p className="text-center text-slate-300 font-bold mb-4">
                {currentMilestone.description}
              </p>

              {/* Bonus Points */}
              {currentMilestone.bonus_points && currentMilestone.bonus_points > 0 && (
                <div className="bg-primary/20 border border-primary/40 rounded-2xl p-4 text-center">
                  <p className="text-primary font-black text-xl">
                    +{currentMilestone.bonus_points} Points
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                    Bonus Reward
                  </p>
                </div>
              )}

              {/* Progress indicator if multiple milestones */}
              {milestones.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {milestones.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentIndex 
                          ? 'w-8 bg-primary' 
                          : 'w-1.5 bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
