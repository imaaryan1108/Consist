'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { formatRelativeTime } from '@/lib/utils'

type User = Database['public']['Tables']['users']['Row']
type Circle = Database['public']['Tables']['circles']['Row']

export default function ProfilePage() {
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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-lg font-bold text-white">Your Profile</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* User Info Card */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20 mb-4">
                {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
            <p className="text-gray-400 text-sm">Member since {new Date(user.created_at).toLocaleDateString()}</p>
            
            {circle && (
                <div className="mt-4 inline-flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-white/5">
                    <span className="text-lg">🎯</span>
                    <span className="text-gray-300 text-sm font-medium">{circle.name}</span>
                </div>
            )}
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5">
                <div className="text-3xl font-bold text-orange-500 mb-1">{user.current_streak}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Current Streak</div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5">
                <div className="text-3xl font-bold text-purple-500 mb-1">{user.longest_streak || 0}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Best Streak</div>
            </div>
             <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5">
                <div className="text-3xl font-bold text-green-500 mb-1">{user.total_days || 0}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total days</div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5">
                <div className="text-3xl font-bold text-blue-500 mb-1">{user.score || 0}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Score</div>
            </div>
        </div>

        {/* Account Actions */}
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest px-1">Account</h3>
            
            <button
                onClick={signOut}
                className="w-full bg-slate-900/50 hover:bg-red-500/10 active:bg-red-500/20 text-red-400 border border-slate-800 hover:border-red-500/30 rounded-xl p-4 flex items-center justify-between transition-all"
            >
                <span className="font-medium">Sign Out</span>
                <span>👋</span>
            </button>
        </div>

        <div className="text-center text-xs text-gray-600 pt-8 pb-4">
            Consist v0.1.0 • Built with ❤️
        </div>
      </div>
    </main>
  )
}
