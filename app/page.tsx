'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Handle hash fragment from magic link redirect
  useEffect(() => {
    // Check if there's a hash fragment (from magic link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')

    if (accessToken) {
      // Magic link succeeded - Supabase client will handle session automatically
      setLoading(true)
      setMessage({ type: 'success', text: 'Authentication successful! Redirecting...' })
      
      // Clear the hash from URL and redirect
      window.history.replaceState(null, '', window.location.pathname)
      
      // Give Supabase a moment to set the session, then redirect
      setTimeout(() => {
        router.push('/onboarding')
      }, 500)
    }
  }, [router])

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Don't specify redirect - let Supabase use Site URL with hash fragment
        },
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Check your email for the magic link! 📧'
      })
      setEmail('')
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send magic link'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-charcoal p-4 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-7xl font-black text-white tracking-tighter">
            CONSIST<span className="text-primary italic">.</span>
          </h1>
          <p className="text-xl text-slate-400 font-medium">
            Build consistency together. <br/>
            <span className="text-white">Stay accountable. Reach elite status.</span>
          </p>
        </div>

        {/* Auth Form */}
        <div className="glass-card rounded-[2rem] p-8 shadow-2xl">
          <form onSubmit={handleMagicLink} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={loading}
                className="w-full px-5 py-4 bg-charcoal-700 border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
                required
              />
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium ${
                message.type === 'success' 
                  ? 'bg-primary/10 border border-primary/20 text-primary' 
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-5 bg-primary text-charcoal font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-neon disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed uppercase tracking-tighter text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                'Get Magic Link'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
            No password needed! We'll send you a link.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-[1.5rem] p-4 text-center">
            <div className="text-2xl mb-1">🔥</div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Streaks</p>
          </div>
          <div className="glass-card rounded-[1.5rem] p-4 text-center">
            <div className="text-2xl mb-1">👥</div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Circles</p>
          </div>
          <div className="glass-card rounded-[1.5rem] p-4 text-center border-primary/30">
            <div className="text-2xl mb-1">⚡</div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Daily</p>
          </div>
        </div>
      </div>
    </main>
  )
}
