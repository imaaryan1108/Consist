'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { ConsistButton } from '@/components/dashboard/ConsistButton'
import { CircleMembers } from '@/components/dashboard/CircleMembers'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'

type User = Database['public']['Tables']['users']['Row']
type Circle = Database['public']['Tables']['circles']['Row']

export default function DashboardPage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading, signOut } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [circle, setCircle] = useState<Circle | null>(null)
  const [loading, setLoading] = useState(true)

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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Consist
            </h1>
            <p className="text-gray-400 text-sm mt-1">{circle.name}</p>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center text-lg border border-white/10"
          >
            {user.name.charAt(0).toUpperCase()}
          </button>
        </header>

        {/* Consist Button Section */}
        <section>
          <ConsistButton 
            hasConsisted={hasConsisted} 
            currentStreak={user.current_streak || 0} 
          />
        </section>

        {/* User Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">{user.current_streak}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">Streak</div>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">{user.longest_streak}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">Record</div>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{user.score}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-1">Points</div>
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
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-purple-500/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <p className="text-sm text-gray-400 mb-2">Invite Friends</p>
            <div className="flex items-center justify-between bg-black/20 rounded-xl p-3 border border-white/5">
              <code className="text-xl font-bold text-white font-mono tracking-widest">
                {circle.code}
              </code>
              <button 
                onClick={() => navigator.clipboard.writeText(circle.code)}
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Share this code with friends to add them to your circle.
            </p>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="pt-4 border-t border-white/5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-widest">Coming Soon</h3>
          <div className="space-y-3 opacity-60">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">🍎</div>
              <div>
                <p className="text-sm text-gray-300">Diet & Macro Logging</p>
                <p className="text-[10px] text-gray-600">Track calories, protein & more</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">🏆</div>
              <div>
                 <p className="text-sm text-gray-300">Levels & Badges</p>
                 <p className="text-[10px] text-gray-600">Rookie → Beast → Elite</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">�</div>
               <div>
                <p className="text-sm text-gray-300">Visual Progress</p>
                <p className="text-[10px] text-gray-600">Heatmaps & Consistency Graphs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
