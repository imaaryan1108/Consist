'use client'

import { Database } from '@/types/database.types'
import { TargetProgress } from '@/app/actions/targets'

type Target = Database['public']['Tables']['targets']['Row']

interface TargetCardProps {
  target: Target
  progress: TargetProgress
}

export function TargetCard({ target, progress }: TargetCardProps) {
  const {
    target_weight_kg,
    current_weight_kg,
    starting_weight_kg,
    days_remaining,
    kg_remaining,
    kg_progress,
    weekly_required_change,
    progress_percentage,
    is_on_track
  } = progress

  const isLosingWeight = target_weight_kg < starting_weight_kg
  
  return (
    <div className="glass-card border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
              Target Weight
            </h3>
            <p className="text-3xl font-black text-white">
              {target_weight_kg.toFixed(1)}<span className="text-lg text-slate-500">kg</span>
            </p>
          </div>
          <div className="text-4xl">{is_on_track ? '🎯' : '⚡'}</div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
              Progress
            </span>
            <span className="text-sm font-black text-primary">
              {progress_percentage.toFixed(0)}%
            </span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 shadow-neon"
              style={{ width: `${Math.min(100, progress_percentage)}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">
              Current
            </p>
            <p className="text-xl font-black text-white">
              {current_weight_kg.toFixed(1)}<span className="text-sm text-slate-500 ml-1">kg</span>
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">
              {isLosingWeight ? 'Remaining' : 'To Gain'}
            </p>
            <p className="text-xl font-black text-primary">
              {kg_remaining.toFixed(1)}<span className="text-sm text-slate-500 ml-1">kg</span>
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">
              {isLosingWeight ? 'Lost' : 'Gained'}
            </p>
            <p className="text-xl font-black text-green-400">
              {kg_progress.toFixed(1)}<span className="text-sm text-slate-500 ml-1">kg</span>
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">
              Days Left
            </p>
            <p className="text-xl font-black text-white">
              {days_remaining}<span className="text-sm text-slate-500 ml-1">days</span>
            </p>
          </div>
        </div>

        {/* Weekly Target */}
        <div className={`p-4 rounded-2xl border ${
          is_on_track 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-yellow-500/10 border-yellow-500/30'
        }`}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
            is_on_track ? 'text-green-500' : 'text-yellow-500'
          }">
            {is_on_track ? '✓ On Track' : '⚠ Needs Adjustment'}
          </p>
          <p className="text-sm font-bold text-white">
            Target: {isLosingWeight ? 'Lose' : 'Gain'}{' '}
            <span className="text-primary font-black">
              {Math.abs(weekly_required_change).toFixed(2)}kg/week
            </span>
          </p>
        </div>

        {/* Custom Message */}
        {target.custom_message && (
          <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-xs italic text-slate-400">&quot;{target.custom_message}&quot;</p>
          </div>
        )}

        {/* Target Date */}
        <div className="mt-4 text-center">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
            Goal Date: {new Date(target.target_date).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
