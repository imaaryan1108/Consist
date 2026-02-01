'use client'

import { motion } from 'framer-motion'

interface TargetWeightHeroProps {
  currentWeight: number
  targetWeight: number
  targetDate?: string
  weightLost?: number
}

export function TargetWeightHero({ 
  currentWeight, 
  targetWeight, 
  targetDate,
  weightLost = 0 
}: TargetWeightHeroProps) {
  const remaining = currentWeight - targetWeight
  const totalToLose = (currentWeight + weightLost) - targetWeight
  const progress = totalToLose > 0 ? ((weightLost / totalToLose) * 100) : 0
  
  const daysToGoal = targetDate 
    ? Math.ceil((new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="glass-card border border-primary/30 rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse opacity-50" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Your Transformation Goal
          </h3>
          <div className="text-2xl">🎯</div>
        </div>

        {/* Target Weight Display */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl font-black text-primary">
              {targetWeight}
            </span>
            <span className="text-xl font-bold text-slate-500">kg</span>
          </div>
          <p className="text-sm text-slate-400 font-bold">
            Your ideal weight
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500">Progress</span>
            <span className="text-sm font-black text-primary">{progress.toFixed(1)}%</span>
          </div>
          
          <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary to-green-400 rounded-full relative"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </motion.div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-xl font-black text-green-400">{weightLost.toFixed(1)}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Lost</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-amber-400">{remaining.toFixed(1)}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">To Go</div>
          </div>
          <div className="text-center">
            {daysToGoal && daysToGoal > 0 ? (
              <>
                <div className="text-xl font-black text-blue-400">{daysToGoal}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Days</div>
              </>
            ) : (
              <>
                <div className="text-xl font-black text-primary">∞</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Goal</div>
              </>
            )}
          </div>
        </div>

        {/* Motivational message */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm font-bold text-center text-slate-400 italic">
            {progress < 25 && "Every step brings you closer to your goal 🚀"}
            {progress >= 25 && progress < 50 && "Quarter way there! Keep the momentum 💪"}
            {progress >= 50 && progress < 75 && "Halfway to transformation! You're crushing it 🔥"}
            {progress >= 75 && progress < 90 && "Final stretch! So close you can taste it ⚡"}
            {progress >= 90 && "Almost there! Your future self is waiting 🌟"}
          </p>
        </div>
      </div>
    </div>
  )
}
