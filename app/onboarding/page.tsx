'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'
import { createCircle, joinCircle } from '@/lib/supabase/helpers'
import { LoadingState } from '@/components/ui/LoadingState'

type Step = 'name' | 'circle-choice' | 'circle-action'
type CircleChoice = 'create' | 'join'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [circleChoice, setCircleChoice] = useState<CircleChoice | null>(null)
  const [circleName, setCircleName] = useState('')
  const [circleCode, setCircleCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('name, circle_id')
        .eq('id', user.id)
        .single()

      if (data) {
        if (data.circle_id) {
          router.push('/dashboard')
        } else if (data.name) {
          setName(data.name)
          setStep('circle-choice')
        }
      }
    }
    checkProfile()
  }, [user, router])

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !user) return
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase
        .from('users')
        .upsert({ id: user.id, name: name.trim(), updated_at: new Date().toISOString() })
      if (error) throw error
      setStep('circle-choice')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!circleName.trim() || !user) return
    setLoading(true)
    setError('')
    try {
      const circle = await createCircle(circleName.trim(), user.id)
      const { error: updateError } = await supabase
        .from('users')
        .update({ circle_id: circle.id })
        .eq('id', user.id)
      if (updateError) throw updateError
      setGeneratedCode(circle.code)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinCircle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!circleCode.trim() || !user) return
    setLoading(true)
    setError('')
    try {
      const circle = await joinCircle(circleCode.trim())
      if (!circle) throw new Error('Circle not found. Check the code and try again.')
      const { error: updateError } = await supabase
        .from('users')
        .update({ circle_id: circle.id })
        .eq('id', user.id)
      if (updateError) throw updateError
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return <LoadingState variant="full" />

  return (
    <main className="min-h-screen bg-charcoal flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/8 blur-[130px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="text-3xl font-black tracking-tighter text-white">
            CONSIST<span className="text-primary italic">.</span>
          </span>
        </div>

        {/* Step 1: Name */}
        {step === 'name' && (
          <div className="glass-card rounded-[2rem] p-8 border border-white/5 space-y-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter text-white">What's your name?</h1>
              <p className="text-slate-500 text-sm font-medium">Your circle will see this.</p>
            </div>

            <form onSubmit={handleNameSubmit} className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="w-full px-5 py-4 bg-charcoal-700 border border-white/5 rounded-2xl text-white font-bold placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                required
              />

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full py-4 bg-primary text-charcoal font-black uppercase tracking-widest rounded-2xl shadow-neon transition-all hover:shadow-neon-strong disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Continue →'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Create or Join */}
        {step === 'circle-choice' && !generatedCode && (
          <div className="glass-card rounded-[2rem] p-8 border border-white/5 space-y-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter text-white">Your circle.</h2>
              <p className="text-slate-500 text-sm font-medium">Start one or join an existing one.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { setCircleChoice('create'); setStep('circle-action') }}
                className="w-full p-6 glass-card rounded-[1.5rem] border border-white/5 hover:border-primary/30 transition-all text-left group"
              >
                <div className="text-3xl mb-3">👥</div>
                <h3 className="text-lg font-black text-white tracking-tight group-hover:text-primary transition-colors">Create a circle</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Start fresh. Invite your crew with a code.</p>
              </button>

              <button
                onClick={() => { setCircleChoice('join'); setStep('circle-action') }}
                className="w-full p-6 glass-card rounded-[1.5rem] border border-white/5 hover:border-primary/30 transition-all text-left group"
              >
                <div className="text-3xl mb-3">🤝</div>
                <h3 className="text-lg font-black text-white tracking-tight group-hover:text-primary transition-colors">Join a circle</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Have a code? Enter it and get in.</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 3a: Create Circle form */}
        {step === 'circle-action' && circleChoice === 'create' && !generatedCode && (
          <div className="glass-card rounded-[2rem] p-8 border border-white/5 space-y-6">
            <button
              onClick={() => setStep('circle-choice')}
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold"
            >
              ← Back
            </button>

            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter text-white">Name your circle.</h2>
              <p className="text-slate-500 text-sm font-medium">Something your crew will recognize.</p>
            </div>

            <form onSubmit={handleCreateCircle} className="space-y-4">
              <input
                type="text"
                value={circleName}
                onChange={(e) => setCircleName(e.target.value)}
                placeholder="e.g. Gym Bros, Morning Warriors"
                autoFocus
                className="w-full px-5 py-4 bg-charcoal-700 border border-white/5 rounded-2xl text-white font-bold placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                required
              />

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !circleName.trim()}
                className="w-full py-4 bg-primary text-charcoal font-black uppercase tracking-widest rounded-2xl shadow-neon transition-all hover:shadow-neon-strong disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Circle →'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3a result: Circle created, show code */}
        {generatedCode && (
          <div className="glass-card rounded-[2rem] p-8 border border-primary/10 space-y-6 text-center">
            <div>
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-3xl font-black tracking-tighter text-white">Circle created!</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">Share this code with your crew.</p>
            </div>

            <div className="bg-black/30 border border-primary/20 rounded-2xl p-6">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Your Circle Code</p>
              <p className="text-5xl font-black text-primary tracking-[0.3em] font-mono">{generatedCode}</p>
            </div>

            <button
              onClick={() => navigator.clipboard.writeText(generatedCode)}
              className="w-full py-3 rounded-2xl border border-white/10 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-white/20 transition-all"
            >
              Copy Code
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-4 bg-primary text-charcoal font-black uppercase tracking-widest rounded-2xl shadow-neon transition-all hover:shadow-neon-strong"
            >
              Go to Dashboard →
            </button>
          </div>
        )}

        {/* Step 3b: Join Circle */}
        {step === 'circle-action' && circleChoice === 'join' && (
          <div className="glass-card rounded-[2rem] p-8 border border-white/5 space-y-6">
            <button
              onClick={() => setStep('circle-choice')}
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold"
            >
              ← Back
            </button>

            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter text-white">Enter the code.</h2>
              <p className="text-slate-500 text-sm font-medium">Get it from whoever created the circle.</p>
            </div>

            <form onSubmit={handleJoinCircle} className="space-y-4">
              <input
                type="text"
                value={circleCode}
                onChange={(e) => setCircleCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                autoFocus
                className="w-full px-5 py-4 bg-charcoal-700 border border-white/5 rounded-2xl text-white font-black text-center text-2xl tracking-[0.3em] placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors uppercase font-mono"
                required
              />

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || circleCode.length !== 6}
                className="w-full py-4 bg-primary text-charcoal font-black uppercase tracking-widest rounded-2xl shadow-neon transition-all hover:shadow-neon-strong disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join Circle →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
