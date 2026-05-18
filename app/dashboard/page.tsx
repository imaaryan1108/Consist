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
import { getDailySummary } from '@/app/actions/meals'
import { getWeeklySummary } from '@/app/actions/history'
import { TargetWeightHero } from '@/components/motivation/TargetWeightHero'
import { GoalsProgressCard } from '@/components/dashboard/GoalsProgressCard'
import { HistoryTrendsCard } from '@/components/dashboard/HistoryTrendsCard'
import { NotificationPermission } from '@/components/dashboard/NotificationPermission'

type User = Database['public']['Tables']['users']['Row']
type Circle = Database['public']['Tables']['circles']['Row']
type Milestone = Database['public']['Tables']['milestones']['Row']
type BodyProfile = Database['public']['Tables']['body_profiles']['Row']
type Target = Database['public']['Tables']['targets']['Row']

import { LoadingState } from '@/components/ui/LoadingState'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { TiltCard } from '@/components/ui/TiltCard'
import { ChapterProgress } from '@/components/gamification/ChapterProgress'
import { NewTitleToast } from '@/components/gamification/NewTitleToast'
import { getTodayDate, getDisplayStreak } from '@/lib/utils'
import { haptic } from '@/lib/utils/haptic'
import { track } from '@/lib/analytics/analytics'

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
  const [dailySummary, setDailySummary] = useState<any>(null)
  const [weeklySummary, setWeeklySummary] = useState<any>(null)
  const [newTitles, setNewTitles] = useState<string[]>([])

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
        
        // Fetch today's summary for Goals card
        const dailyData = await getDailySummary()
        setDailySummary(dailyData)
        
        // Fetch this week's summary for History card
        const weeklyData = await getWeeklySummary()
        setWeeklySummary(weeklyData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()

    // Refetch target progress when user returns to this tab (e.g. after updating weight in profile)
    const handleFocus = async () => {
      if (!authUser) return
      const [profileData, progressData] = await Promise.all([
        getBodyProfile(),
        getTargetProgress(),
      ])
      if (profileData) setBodyProfile(profileData)
      if (progressData) setTargetProgress(progressData)
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [authUser, router])

  // Real-time subscription for meals - update daily summary
  useEffect(() => {
    if (!authUser) return

    const mealsChannel = supabase
      .channel('dashboard_meals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meals',
          filter: `user_id=eq.${authUser.id}`
        },
        async () => {
          console.log('Meal change detected on dashboard, refreshing...')
          const [dailyData, weeklyData] = await Promise.all([
            getDailySummary(),
            getWeeklySummary()
          ])
          setDailySummary(dailyData)
          setWeeklySummary(weeklyData)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(mealsChannel)
    }
  }, [authUser])

  // Real-time subscription for workouts - update weekly summary
  useEffect(() => {
    if (!authUser) return

    const workoutsChannel = supabase
      .channel('dashboard_workouts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workouts',
          filter: `user_id=eq.${authUser.id}`
        },
        async () => {
          console.log('Workout change detected on dashboard, refreshing...')
          const weeklyData = await getWeeklySummary()
          setWeeklySummary(weeklyData)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(workoutsChannel)
    }
  }, [authUser])

  // Real-time subscription for body profiles - update profile and target progress
  useEffect(() => {
    if (!authUser) return

    const profilesChannel = supabase
      .channel('dashboard_profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'body_profiles',
          filter: `user_id=eq.${authUser.id}`
        },
        async () => {
          console.log('Body profile change detected, refreshing...')
          const profileData = await getBodyProfile()
          setBodyProfile(profileData)
          
          if (target) {
            const progressData = await getTargetProgress()
            setTargetProgress(progressData)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(profilesChannel)
    }
  }, [authUser, target])

  if (authLoading || loading) {
    return <LoadingState variant="full" />
  }

  if (!user || !circle) {
    return null
  }

  if (!user || !circle) {
    return null
  }

  const today = getTodayDate()
  const hasConsisted = user.last_consist_date === today
  const displayStreak = getDisplayStreak(user.current_streak ?? 0, user.last_consist_date)

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

        {/* New Title Toast */}
        <NewTitleToast titleKeys={newTitles} onClose={() => setNewTitles([])} />

        {/* Push Notification Permission Banner */}
        <NotificationPermission />

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
            onClose={() => {
              // Remember dismissal for this Sunday so it doesn't re-prompt on next punch-in
              const today = new Date()
              const key = `checkin_dismissed_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`
              localStorage.setItem(key, '1')
              setShowWeeklyCheckin(false)
            }}
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

        {/* Consist Button */}
        <AnimatedSection delay={0.05}>
        <section className="neon-glow rounded-[2.5rem]">
          <ConsistButton
            hasConsisted={hasConsisted}
            currentStreak={displayStreak}
            onMilestones={(newMilestones) => setMilestones(newMilestones)}
            onNewTitles={(titles) => setNewTitles(titles)}
            onWeeklyCheckinPrompt={() => {
              const today = new Date()
              const key = `checkin_dismissed_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`
              if (!localStorage.getItem(key)) {
                setShowWeeklyCheckin(true)
              }
            }}
          />
        </section>
        </AnimatedSection>

        {/* Personal Streak */}
        <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-3 gap-3">
          <TiltCard intensity={15} className="glass-card rounded-3xl p-5 text-center">
            <AnimatedNumber value={displayStreak} className="text-3xl font-black text-white" />
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Streak</div>
          </TiltCard>
          <TiltCard intensity={15} className="glass-card rounded-3xl p-5 text-center border-primary/20">
            <AnimatedNumber value={user.longest_streak ?? 0} className="text-3xl font-black text-primary" />
            <div className="text-[10px] uppercase tracking-widest text-primary/50 font-bold mt-1">Record</div>
          </TiltCard>
          <TiltCard intensity={15} className="glass-card rounded-3xl p-5 text-center">
            <AnimatedNumber value={user.score ?? 0} className="text-3xl font-black text-white" />
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Points</div>
          </TiltCard>
        </div>
        </AnimatedSection>

        {/* Today's Pulse */}
        <AnimatedSection delay={0.15}>
        <section>
          <CircleMembers circleId={circle.id} currentUserId={user.id} />
        </section>
        </AnimatedSection>

        {/* Chapter Progress */}
        <AnimatedSection delay={0.18}>
          <ChapterProgress circleId={circle.id} />
        </AnimatedSection>

        {/* Today's Goals */}
        {dailySummary && (
          <AnimatedSection delay={0.2}>
          <GoalsProgressCard
            current={{
              calories: dailySummary.total_calories,
              protein: dailySummary.total_protein,
              carbs: dailySummary.total_carbs,
              fats: dailySummary.total_fats
            }}
            targets={{
              calories: target?.target_calories_daily,
              protein: target?.target_protein_g_daily,
              carbs: target?.target_carbs_g_daily,
              fats: target?.target_fats_g_daily
            }}
            targetWeight={
              target && bodyProfile && targetProgress
                ? {
                    current: bodyProfile.current_weight_kg,
                    target: target.target_weight_kg,
                    progress: targetProgress.progress_percentage
                  }
                : null
            }
          />
          </AnimatedSection>
        )}

        {/* Transformation Goal */}
        {target && bodyProfile && targetProgress && (
          <AnimatedSection delay={0.05}>
          <TargetWeightHero
            currentWeight={bodyProfile.current_weight_kg}
            targetWeight={target.target_weight_kg}
            targetDate={target.target_date}
            weightLost={targetProgress.weight_lost_kg}
          />
          </AnimatedSection>
        )}

        {/* History */}
        {weeklySummary && (
          <AnimatedSection delay={0.05}>
          <HistoryTrendsCard
            weekSummary={{
              daysTracked: weeklySummary.daysTracked,
              totalCalories: weeklySummary.totalCalories,
              avgCalories: weeklySummary.avgCalories,
              totalProtein: weeklySummary.totalProtein,
              workoutsCompleted: weeklySummary.workoutsCompleted
            }}
          />
          </AnimatedSection>
        )}

        {/* Circle Activity — last 7 days, scrollable */}
        <AnimatedSection delay={0.05}>
        <section className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Circle Activity</p>
          </div>
          <div className="max-h-80 overflow-y-auto px-5 pb-5">
            <ActivityFeed circleId={circle.id} />
          </div>
        </section>
        </AnimatedSection>

        {/* Invite Friends */}
        <AnimatedSection delay={0.05}>
        <div className="glass-card rounded-[2rem] p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Invite Friends</p>
          <div className="flex items-center justify-between bg-black/40 rounded-2xl p-4 border border-white/5">
            <code className="text-2xl font-black text-white tracking-[0.2em]">
              {circle.code}
            </code>
            <button
              onClick={() => { haptic('light'); navigator.clipboard.writeText(circle.code); track.circleCodeCopied() }}
              className="text-xs bg-primary text-charcoal font-black px-4 py-2 rounded-xl active:scale-95 transition-all uppercase tracking-tighter"
            >
              Copy
            </button>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-4 uppercase tracking-wider text-center">
            Share this code to build your circle.
          </p>
        </div>
        </AnimatedSection>

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
