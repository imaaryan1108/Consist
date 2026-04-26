'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type AuthStep = 'email' | 'verify-otp'

export default function Home() {
  const router = useRouter()
  const [step, setStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  const handleSendOTP = async (e: React.FormEvent) => {
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
          shouldCreateUser: true,
        },
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Code sent! Check your email 📧'
      })
      setStep('verify-otp')
      setResendCountdown(60)
      
      // Focus first OTP input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send code'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('')
    
    if (otpCode.length !== 8) {
      setMessage({ type: 'error', text: 'Please enter the complete code' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email'
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Verified! Redirecting...' })
      
      setTimeout(() => {
        router.push('/onboarding')
      }, 500)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Invalid or expired code'
      })
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '', '', ''])
      otpInputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-advance to next input
    if (value && index < 7) {
      otpInputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 8 digits entered
    if (index === 7 && value) {
      const fullCode = newOtp.join('')
      if (fullCode.length === 8) {
        // Small delay to show the last digit before submitting
        setTimeout(() => {
          handleVerifyOTP()
        }, 100)
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    
    // Check if it's an 8-digit code
    if (/^\d{8}$/.test(pastedData)) {
      const digits = pastedData.split('')
      setOtp(digits)
      // Focus last input
      otpInputRefs.current[7]?.focus()
      // Auto-submit after paste
      setTimeout(() => {
        handleVerifyOTP()
      }, 100)
    }
  }

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return
    
    setLoading(true)
    setMessage(null)
    setOtp(['', '', '', '', '', '', '', ''])

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'New code sent! 📧'
      })
      setResendCountdown(60)
      otpInputRefs.current[0]?.focus()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to resend code'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setOtp(['', '', '', '', '', '', '', ''])
    setMessage(null)
    setResendCountdown(0)
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
          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
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
                  'Send Code'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <button
                  onClick={handleBackToEmail}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium mb-4"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Change email
                </button>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                  Enter Verification Code
                </label>
                <p className="text-sm text-slate-400 mb-4">
                  Sent to <span className="text-white font-medium">{email}</span>
                </p>
                
                {/* OTP Input */}
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={loading}
                      className="w-12 h-14 text-center text-2xl font-bold bg-charcoal-700 border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
                    />
                  ))}
                </div>
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
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length !== 8}
                className="w-full px-8 py-5 bg-primary text-charcoal font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-neon disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed uppercase tracking-tighter text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify Code'
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={handleResendOTP}
                  disabled={resendCountdown > 0 || loading}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCountdown > 0 
                    ? `Resend code in ${resendCountdown}s` 
                    : 'Resend code'}
                </button>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
            {step === 'email' ? 'No password needed! We\'ll send you a code.' : 'Code expires in 60 seconds'}
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
