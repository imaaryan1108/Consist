'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'
import { createCircle, joinCircle, generateCircleCode } from '@/lib/supabase/helpers'
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
      router.push('/')
    }
  }, [user, authLoading, router])

  // Check if user already has a profile
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
          // User already has circle, go to dashboard
          router.push('/dashboard')
        } else if (data.name) {
          // User has name but no circle
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
        .upsert({
          id: user.id,
          name: name.trim(),
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setStep('circle-choice')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCircleChoice = (choice: CircleChoice) => {
    setCircleChoice(choice)
    setStep('circle-action')
  }

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!circleName.trim() || !user) return

    setLoading(true)
    setError('')

    try {
      // Create the circle
      const circle = await createCircle(circleName.trim(), user.id)
      
      // Update user with circle_id
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

      if (!circle) {
        throw new Error('Circle not found. Please check the code and try again.')
      }

      // Update user with circle_id
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

  if (authLoading) {
    return <LoadingState variant="full" />
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Step 1: Enter Name */}
        {step === 'name' && (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-2xl space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome to Consist! 🎯</h1>
              <p className="text-gray-400">Let's get you set up</p>
            </div>

            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  What's your name?
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Choose Create or Join */}
        {step === 'circle-choice' && !generatedCode && (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-2xl space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Join Your Circle 👥</h2>
              <p className="text-gray-400">Create a new circle or join an existing one</p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => handleCircleChoice('create')}
                className="p-6 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-orange-500 rounded-xl transition-all text-left"
              >
                <div className="text-3xl mb-2">🆕</div>
                <h3 className="text-xl font-semibold text-white mb-1">Create New Circle</h3>
                <p className="text-gray-400 text-sm">Start a consistency circle and invite your friends</p>
              </button>

              <button
                onClick={() => handleCircleChoice('join')}
                className="p-6 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-purple-500 rounded-xl transition-all text-left"
              >
                <div className="text-3xl mb-2">🤝</div>
                <h3 className="text-xl font-semibold text-white mb-1">Join Existing Circle</h3>
                <p className="text-gray-400 text-sm">Enter a circle code to join your friends</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 3a: Create Circle */}
        {step === 'circle-action' && circleChoice === 'create' && !generatedCode && (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-2xl space-y-6">
            <button
              onClick={() => setStep('circle-choice')}
              className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              ← Back
            </button>

            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Create Your Circle 🆕</h2>
              <p className="text-gray-400">Give your circle a name</p>
            </div>

            <form onSubmit={handleCreateCircle} className="space-y-4">
              <div>
                <label htmlFor="circleName" className="block text-sm font-medium text-gray-300 mb-2">
                  Circle Name
                </label>
                <input
                  id="circleName"
                  type="text"
                  value={circleName}
                  onChange={(e) => setCircleName(e.target.value)}
                  placeholder="e.g., Gym Bros, Morning Warriors"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !circleName.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Circle'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3a-result: Show Generated Code */}
        {generatedCode && (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-2xl space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-2">Circle Created!</h2>
              <p className="text-gray-400">Share this code with your friends</p>
            </div>

            <div className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 border-2 border-orange-500 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-300 mb-2">Your Circle Code</p>
              <p className="text-5xl font-bold text-white tracking-wider font-mono">{generatedCode}</p>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              Go to Dashboard
            </button>

            <p className="text-center text-sm text-gray-400">
              Friends can use this code to join your circle
            </p>
          </div>
        )}

        {/* Step 3b: Join Circle */}
        {step === 'circle-action' && circleChoice === 'join' && (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-2xl space-y-6">
            <button
              onClick={() => setStep('circle-choice')}
              className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              ← Back
            </button>

            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Join a Circle 🤝</h2>
              <p className="text-gray-400">Enter the 6-character code</p>
            </div>

            <form onSubmit={handleJoinCircle} className="space-y-4">
              <div>
                <label htmlFor="circleCode" className="block text-sm font-medium text-gray-300 mb-2">
                  Circle Code
                </label>
                <input
                  id="circleCode"
                  type="text"
                  value={circleCode}
                  onChange={(e) => setCircleCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-center text-2xl font-mono tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || circleCode.length !== 6}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join Circle'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
