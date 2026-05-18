'use client'

import { motion } from 'framer-motion'

interface Scar {
  streak: number
  date: string
}

interface Props {
  scars: Scar[]       // past broken streaks
  longestEver: number
}

export function BattleScars({ scars, longestEver }: Props) {
  if (!scars.length && longestEver === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Battle Scars</p>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {longestEver > 0 && (
        <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-black text-white text-sm">{longestEver} day streak</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">All-time record</p>
          </div>
        </div>
      )}

      {scars.length > 0 && (
        <div className="space-y-2">
          {scars.map((scar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl px-4 py-2.5"
            >
              <span className="text-lg">💀</span>
              <div className="flex-1">
                <p className="text-sm font-black text-slate-400">
                  RIP {scar.streak}-day streak
                </p>
                <p className="text-[10px] text-slate-600 font-medium">
                  {new Date(scar.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Carried</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
