'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { formatRelativeTime } from '@/lib/utils'
import { getBodyProfile } from '@/app/actions/body-profile'
import { getTarget, getTargetProgress } from '@/app/actions/targets'
import { BodyProfileForm } from '@/components/transformation/BodyProfileForm'
import { TargetSetupForm } from '@/components/transformation/TargetSetupForm'
import { WeeklyCheckinModal } from '@/components/transformation/WeeklyCheckinModal'
import { TargetProgress } from '@/app/actions/targets'

type User = Database['public']['Tables']['users']['Row']
type Circle = Database['public']['Tables']['circles']['Row']
type BodyProfile = Database['public']['Tables']['body_profiles']['Row']
type Target = Database['public']['Tables']['targets']['Row']

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading, signOut } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [circle, setCircle] = useState<Circle | null>(null)
  const [bodyProfile, setBodyProfile] = useState<BodyProfile | null>(null)
  const [target, setTarget] = useState<Target | null>(null)
  const [targetProgress, setTargetProgress] = useState<TargetProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWeeklyCheckin, setShowWeeklyCheckin] = useState(false)
  const [editingTarget, setEditingTarget] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser) return

      try {
        // Fetch user profile
        const { data: userDataRaw, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (userError) throw userError
        
        const userData = userDataRaw as unknown as User
        setUser(userData)

        // Fetch circle data
        if (userData.circle_id) {
            const { data: circleData, error: circleError } = await supabase
            .from('circles')
            .select('*')
            .eq('id', userData.circle_id)
            .single()

            if (circleError) throw circleError
            setCircle(circleData)
        }

        // Fetch transformation data
        const [bodyProfileData, targetData, progressData] = await Promise.all([
          getBodyProfile(),
          getTarget(),
          getTargetProgress()
        ])

        setBodyProfile(bodyProfileData)
        setTarget(targetData)
        setTargetProgress(progressData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [authUser])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-charcoal p-4 pb-20 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-md mx-auto space-y-6 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"
          >
            ← BACK
          </button>
          <h1 className="text-xs font-black text-white uppercase tracking-[0.2em]">User Profile</h1>
          <div className="w-10" />
        </header>

        {/* User Info Card */}
        <div className="glass-card rounded-[2.5rem] p-8 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-24 h-24 mx-auto bg-primary rounded-3xl flex items-center justify-center text-4xl font-black text-charcoal shadow-neon mb-6 relative z-10 rotate-3 group-hover:rotate-0 transition-transform">
                {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase italic">{user.name}</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">
                Operative since {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </p>
            
            {circle && (
                <div className="mt-6 inline-flex items-center gap-2 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/5">
                    <span className="text-primary font-black italic text-xs tracking-widest uppercase">{circle.name}</span>
                </div>
            )}
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-3xl p-6 border-primary/20">
                <div className="text-4xl font-black text-primary mb-1 italic tracking-tighter">{user.current_streak}</div>
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Current Streak</div>
            </div>
            <div className="glass-card rounded-3xl p-6">
                <div className="text-4xl font-black text-white mb-1 italic tracking-tighter">{user.longest_streak || 0}</div>
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Elite Record</div>
            </div>
             <div className="glass-card rounded-3xl p-6">
                <div className="text-4xl font-black text-white mb-1 italic tracking-tighter">{user.total_days || 0}</div>
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Days</div>
            </div>
            <div className="glass-card rounded-3xl p-6">
                <div className="text-4xl font-black text-white mb-1 italic tracking-tighter">{user.score || 0}</div>
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Score</div>
            </div>
        </div>

        {/* Transformation Section */}
        <div className="space-y-4 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] px-2 italic">
              Transformation
            </h3>
            <button
              onClick={() => router.push('/tracking')}
              className="text-primary text-xs font-black hover:text-primary/80 transition-colors"
            >
              TRACK →
            </button>
          </div>

          {/* Weekly Check-in Modal */}
          {showWeeklyCheckin && bodyProfile && (
            <WeeklyCheckinModal
              bodyProfile={bodyProfile}
              onClose={() => setShowWeeklyCheckin(false)}
              onSuccess={async () => {
                // Refresh profile data
                const updated = await getBodyProfile()
                if (updated) {
                  setBodyProfile(updated)
                  // Refresh target progress if exists
                  if (target) {
                    const progressData = await getTargetProgress()
                    setTargetProgress(progressData)
                  }
                }
                router.refresh()
              }}
            />
          )}

          {bodyProfile ? (
            <>
              {/* Body Stats Card */}
              <div className="glass-card border border-white/10 rounded-3xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                      Current Stats
                    </p>
                  </div>
                  <button
                    onClick={() => setShowWeeklyCheckin(true)}
                    className="text-xs font-black text-primary hover:text-primary/80 transition-colors"
                  >
                    UPDATE →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-2xl font-black text-white">
                      {bodyProfile.current_weight_kg.toFixed(1)}
                      <span className="text-sm text-slate-500 ml-1">kg</span>
                    </p>
                    <p className="text-[10px] text-slate-600 font-bold uppercase">Weight</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">
                      {bodyProfile.height_cm}
                      <span className="text-sm text-slate-500 ml-1">cm</span>
                    </p>
                    <p className="text-[10px] text-slate-600 font-bold uppercase">Height</p>
                  </div>
                </div>
              </div>

              {/* Target Progress OR Target Setup */}
              {target && targetProgress && !editingTarget ? (
                <div className="glass-card border border-white/10 rounded-3xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                        Target Progress
                      </p>
                      <p className="text-xl font-black text-primary mt-1">
                        {target.target_weight_kg.toFixed(1)}kg
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingTarget(true)}
                      className="text-xs font-black text-primary hover:text-primary/80 transition-colors"
                    >
                      EDIT →
                    </button>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(100, targetProgress.progress_percentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm font-black text-green-400">
                        {targetProgress.kg_progress.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-slate-600 font-bold">Lost</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">
                        {targetProgress.kg_remaining.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-slate-600 font-bold">Left</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">
                        {targetProgress.days_remaining}
                      </p>
                      <p className="text-[10px] text-slate-600 font-bold">Days</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card border border-white/10 rounded-3xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">
                      {target ? 'Edit Your Goal' : 'Set Your Goal'}
                    </h3>
                    {target && editingTarget && (
                      <button
                        onClick={() => setEditingTarget(false)}
                        className="text-xs font-black text-slate-500 hover:text-white transition-colors"
                      >
                        ✕ CANCEL
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    {target 
                      ? 'Update your target weight, date, and daily macro goals' 
                      : 'Set a target weight and date to track your progress'}
                  </p>
                  <TargetSetupForm
                    bodyProfile={bodyProfile}
                    existingTarget={target}
                    onSuccess={async () => {
                      const [targetData, progressData] = await Promise.all([
                        getTarget(),
                        getTargetProgress()
                      ])
                      setTarget(targetData)
                      setTargetProgress(progressData)
                      setEditingTarget(false)
                      router.refresh()
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="glass-card border border-white/10 rounded-3xl p-6">
              <div className="mb-4">
                <h3 className="text-xl font-black text-white mb-2">
                  Set Up Your Profile
                </h3>
                <p className="text-slate-500 text-sm">
                  Enter your height, weight, and measurements to start tracking your transformation.
                </p>
              </div>
              <BodyProfileForm
                onSuccess={async () => {
                  // Refresh the profile data
                  const updated = await getBodyProfile()
                  setBodyProfile(updated)
                  router.refresh()
                }}
              />
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="space-y-4 pt-4">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] px-2 italic">Settings</h3>
            
            <button
                onClick={signOut}
                className="w-full glass-card hover:bg-red-500/10 active:bg-red-500/20 text-red-400 border border-white/5 hover:border-red-500/20 rounded-3xl p-5 flex items-center justify-between transition-all group"
            >
                <span className="font-black uppercase tracking-widest text-xs">Terminate Session</span>
                <span className="group-hover:translate-x-1 transition-transform">👋</span>
            </button>
        </div>

        <div className="text-center text-[10px] font-black text-slate-700 pt-12 pb-4 uppercase tracking-[0.4em] italic">
            Consist v0.1.0 • Built for the elite
        </div>
      </div>
    </main>
  )
}
