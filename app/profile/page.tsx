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
                Operative since {new Date(user.created_at).toLocaleDateString()}
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
