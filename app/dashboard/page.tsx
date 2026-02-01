'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { ConsistButton } from '@/components/dashboard/ConsistButton'
import { CircleMembers } from '@/components/dashboard/CircleMembers'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { MilestoneToast } from '@/components/transformation/MilestoneToast'
import { WeeklyCheckinModal } from '@/components/transformation/WeeklyCheckinModal'
import { getBodyProfile } from '@/app/actions/body-profile'
import { getTarget, getTargetProgress } from '@/app/actions/targets'
import { MotivationalQuoteCard } from '@/components/motivation/MotivationalQuoteCard'
import { TargetWeightHero } from '@/components/motivation/TargetWeightHero'
import { StreakCelebration } from '@/components/motivation/StreakCelebration'

type User = Database['public']['Tables']['users']['Row']
type Circle = Database['public']['Tables']['circles']['Row']
type Milestone = Database['public']['Tables']['milestones']['Row']
type BodyProfile = Database['public']['Tables']['body_profiles']['Row']
type Target = Database['public']['Tables']['targets']['Row']

export default function DashboardPage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading, signOut } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [circle, setCircle] = useState<Circle | null>(null)
  const [bodyProfile, setBodyProfile] = useState<BodyProfile | null>(null)
  const [target, setTarget] = useState<Target | null>(null)
  const [targetProgress, setTargetProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Transformation feature states
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [showWeeklyCheckin, setShowWeeklyCheckin] = useState(false)

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

        if (!userData.circle_id) {
          // No circle, redirect to onboarding
          router.push('/onboarding')
          return
        }

        setUser(userData)

        // Fetch circle data
        const { data: circleData, error: circleError } = await supabase
          .from('circles')
          .select('*')
          .eq('id', userData.circle_id)
          .single()

        if (circleError) throw circleError

        setCircle(circleData)

        // Fetch body profile for weekly check-in modal
        const profileData = await getBodyProfile()
        setBodyProfile(profileData)
        
        // Fetch target and progress
        const targetData = await getTarget()
        setTarget(targetData)
        
        if (targetData) {
          const progressData = await getTargetProgress()
          setTargetProgress(progressData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [authUser, router])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (!user || !circle) {
    return null
  }

  if (!user || !circle) {
    return null
  }

  // Check if consisted today (client-side calculation for now, could be passed from server)
  const today = new Date().toISOString().split('T')[0]
  const hasConsisted = user.last_consist_date === today

  return (
    <main className="min-h-screen bg-charcoal p-4 pb-20 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-md mx-auto space-y-6 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">
                CONSIST<span className="text-primary italic">.</span>
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 italic">{circle.name}</p>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="w-12 h-12 rounded-2xl bg-charcoal-700 border border-white/10 hover:border-primary/50 transition-all flex items-center justify-center text-xl font-bold shadow-lg"
          >
            {user.name.charAt(0).toUpperCase()}
          </button>
        </header>

        {/* Milestone Toast */}
        {milestones.length > 0 && (
          <MilestoneToast
            milestones={milestones}
            onClose={(id) => {
              setMilestones(prev => prev.filter(m => m.id !== id))
            }}
          />
        )}

        {/* Weekly Check-in Modal */}
        {showWeeklyCheckin && bodyProfile && (
          <WeeklyCheckinModal
            bodyProfile={bodyProfile}
            onClose={() => setShowWeeklyCheckin(false)}
            onSuccess={() => {
              router.refresh()
              const fetchProfile = async () => {
                const updated = await getBodyProfile()
                if (updated) setBodyProfile(updated)
              }
              fetchProfile()
            }}
          />
        )}

        {/* Consist Button Section */}
        <section className="neon-glow rounded-[2.5rem]">
          <ConsistButton 
            hasConsisted={hasConsisted} 
            currentStreak={user.current_streak || 0}
            onMilestones={(newMilestones) => setMilestones(newMilestones)}
            onWeeklyCheckinPrompt={() => setShowWeeklyCheckin(true)}
          />
        </section>

        {/* Motivational Quote */}
        <MotivationalQuoteCard />

        {/* Target Weight Hero (if target exists) */}
        {target && bodyProfile && targetProgress && (
          <TargetWeightHero
            currentWeight={bodyProfile.current_weight_kg}
            targetWeight={target.target_weight_kg}
            targetDate={target.target_date}
            weightLost={targetProgress.weight_lost_kg}
          />
        )}

        {/* Streak Celebration */}
        {(user.current_streak ?? 0) > 0 && (
          <StreakCelebration
            streak={user.current_streak ?? 0}
            showCelebration={(user.current_streak ?? 0) % 7 === 0}
          />
        )}

        {/* User Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-3xl p-5 text-center">
            <div className="text-3xl font-black text-white">{user.current_streak}</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Streak</div>
          </div>
          <div className="glass-card rounded-3xl p-5 text-center border-primary/20">
            <div className="text-3xl font-black text-primary">{user.longest_streak}</div>
            <div className="text-[10px] uppercase tracking-widest text-primary/50 font-bold mt-1">Record</div>
          </div>
          <div className="glass-card rounded-3xl p-5 text-center">
            <div className="text-3xl font-black text-white">{user.score}</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Points</div>
          </div>
        </div>

        {/* Circle Members List */}
        <section>
            <CircleMembers 
                circleId={circle.id} 
                currentUserId={user.id} 
            />
        </section>

        {/* Activity Feed */}
        <section>
            <ActivityFeed circleId={circle.id} />
        </section>

        {/* Circle Code Card */}
        <div className="glass-card rounded-[2rem] p-6 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Invite Friends</p>
            <div className="flex items-center justify-between bg-black/40 rounded-2xl p-4 border border-white/5">
              <code className="text-2xl font-black text-white tracking-[0.2em]">
                {circle.code}
              </code>
              <button 
                onClick={() => navigator.clipboard.writeText(circle.code)}
                className="text-xs bg-primary text-charcoal font-black px-4 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter"
              >
                Copy
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-4 uppercase tracking-wider text-center">
              Share this code to build your circle.
            </p>
          </div>
        </div>

        {/* Coming Soon Section
        <div className="pt-6 border-t border-white/5">
          <h3 className="text-xs font-black text-slate-500 mb-6 uppercase tracking-[0.2em]">Roadmap</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 grayscale opacity-50">
              <div className="w-10 h-10 rounded-2xl bg-charcoal-700 flex items-center justify-center text-lg">🍎</div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Diet & Macro Logging</p>
                <p className="text-[10px] text-slate-600 font-medium uppercase mt-1">Coming Soon</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 grayscale opacity-50">
              <div className="w-10 h-10 rounded-2xl bg-charcoal-700 flex items-center justify-center text-lg">🏆</div>
              <div>
                 <p className="text-xs font-bold text-white uppercase tracking-wider">Levels & Badges</p>
                 <p className="text-[10px] text-slate-600 font-medium uppercase mt-1">Coming Soon</p>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </main>
  )
}
