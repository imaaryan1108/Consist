'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

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
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (userError) throw userError

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Consist
            </h1>
            <p className="text-gray-400 text-sm mt-1">{circle.name}</p>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg transition-all"
          >
            Sign Out
          </button>
        </header>

        {/* Welcome Section */}
        <div className="mt-8 bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user.name}! 👋
          </h2>
          <p className="text-gray-400">
            You're in the <span className="text-orange-500 font-semibold">{circle.name}</span> circle
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-orange-500">{user.current_streak}</div>
              <div className="text-sm text-gray-400 mt-1">Current Streak</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-500">{user.longest_streak}</div>
              <div className="text-sm text-gray-400 mt-1">Longest Streak</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-500">{user.score}</div>
              <div className="text-sm text-gray-400 mt-1">Total Points</div>
            </div>
          </div>

          {/* Circle Code */}
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Circle Code</p>
                <p className="text-2xl font-bold text-white font-mono tracking-wider">{circle.code}</p>
              </div>
              <p className="text-xs text-gray-500">Share with friends</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-8 bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800">
          <h3 className="text-xl font-bold text-white mb-4">🚧 Coming Soon</h3>
          <div className="space-y-3 text-gray-400">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <p>Daily "I Consisted Today" button</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <p>Circle members view with live updates</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <p>Push to Consist feature</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <p>Activity feed</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
