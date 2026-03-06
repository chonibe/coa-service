'use client'

import { useState, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Sheet, Modal, Button, Input } from '@/components/ui'
import { useExperienceTheme } from '@/app/shop/experience/ExperienceThemeContext'
import { cn } from '@/lib/utils'

const DESKTOP_BREAKPOINT = 768

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useLayoutEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export interface AuthSlideupMenuProps {
  open: boolean
  onClose: () => void
  /** Redirect path after successful login (default: /shop/experience) */
  redirectTo?: string
}

const COLLECTOR_REDIRECT = '/shop/experience'

/** Set to true to show Facebook login option */
const SHOW_FACEBOOK_LOGIN = false

/** Supabase returns this when built-in email limit (2/hour) is hit. Custom SMTP fixes it. */
const RATE_LIMIT_HINT = 'Email sending is temporarily limited. Try signing in with Google or Facebook instead, or try again in about an hour.'

function isEmailRateLimitError(message: string): boolean {
  const lower = message.toLowerCase()
  return lower.includes('rate limit') || lower.includes('too many') || (lower.includes('email') && lower.includes('exceeded'))
}

type Step = 'email' | 'code'

export function AuthSlideupMenu({ open, onClose, redirectTo = COLLECTOR_REDIRECT }: AuthSlideupMenuProps) {
  const { theme } = useExperienceTheme()
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const reset = () => {
    setStep('email')
    setEmail('')
    setCode('')
    setError(null)
    setIsLoading(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email address')
      setIsLoading(false)
      return
    }

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: true,
        },
      })

      if (otpError) {
        console.error('[AuthSlideupMenu] OTP error:', otpError)
        const msg = isEmailRateLimitError(otpError.message) ? RATE_LIMIT_HINT : otpError.message
        const smtpHint = otpError.message?.toLowerCase().includes('500') || otpError.message?.toLowerCase().includes('internal')
          ? ' Check Supabase SMTP settings (Auth → SMTP) if you recently changed them.'
          : ''
        setError(msg + smtpHint)
        setIsLoading(false)
        return
      }

      setStep('code')
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return
    setError(null)
    setIsLoading(true)
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      })
      if (otpError) {
        console.error('[AuthSlideupMenu] OTP resend error:', otpError)
        setError(isEmailRateLimitError(otpError.message) ? RATE_LIMIT_HINT : otpError.message)
      }
      else setResendCooldown(60)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const trimmedCode = code.replace(/\s/g, '')
    if (!trimmedCode) {
      setError('Please enter the code from your email')
      setIsLoading(false)
      return
    }

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: trimmedCode,
        type: 'email',
      })

      if (verifyError) {
        setError(verifyError.message)
        setIsLoading(false)
        return
      }

      if (data?.session?.access_token) {
        const res = await fetch('/api/auth/collector/ensure-profile', {
          method: 'POST',
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          credentials: 'include',
        })
        if (!res.ok) {
          console.warn('[AuthSlideup] ensure-profile failed:', await res.text())
        }
        handleClose()
        router.push(redirectTo)
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuth = (provider: 'google' | 'facebook') => {
    handleClose()
    const path = `/api/auth/collector/${provider}/start?redirect=${encodeURIComponent(redirectTo)}`
    window.location.href = path
  }

  const handleBack = () => {
    setStep('email')
    setCode('')
    setError(null)
  }

  const isDesktop = useIsDesktop()

  const content = (
    <div className="flex flex-col">
        {step === 'email' ? (
          <>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">Login or Sign Up</h2>
            <form onSubmit={handleEmailContinue} className="mt-4 space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-neutral-300 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-400"
                autoComplete="email"
                disabled={isLoading}
              />
              <Button
                type="submit"
                className="w-full h-12 bg-[#047AFF] hover:bg-[#0366d6] text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  'Continue'
                )}
              </Button>
            </form>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2" role="alert">
                {error}
              </p>
            )}

            <div className="relative flex items-center my-6">
              <div className="flex-1 border-t border-neutral-200 dark:border-white/10" />
              <span className="px-3 text-sm text-neutral-500 dark:text-neutral-400">or</span>
              <div className="flex-1 border-t border-neutral-200 dark:border-white/10" />
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-neutral-300 dark:border-white/20 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 font-medium dark:text-white"
                onClick={() => handleOAuth('google')}
              >
                <GoogleIcon className="h-5 w-5 mr-3" />
                Continue with Google
              </Button>
              {SHOW_FACEBOOK_LOGIN && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-neutral-300 dark:border-white/20 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 font-medium dark:text-white"
                  onClick={() => handleOAuth('facebook')}
                >
                  <FacebookIcon className="h-5 w-5 mr-3" />
                  Continue with Facebook
                </Button>
              )}
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-6 text-center">
              By signing up you agree to our{' '}
              <a href="/terms" className="underline hover:text-neutral-700 dark:hover:text-neutral-300">Terms of Use</a>
              {' '}and{' '}
              <a href="/privacy" className="underline hover:text-neutral-700 dark:hover:text-neutral-300">Privacy Policy</a>.
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white mb-4 -ml-1"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">Code Sent to Email</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              An email with the code has been sent to{' '}
              <span className="font-medium text-neutral-900 dark:text-white">{email}</span>
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Enter Code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-12 border-neutral-300 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-400 text-center text-lg tracking-widest"
                maxLength={6}
                disabled={isLoading}
                autoFocus
              />
              <Button
                type="submit"
                className="w-full h-12 bg-[#047AFF] hover:bg-[#0366d6] text-white font-semibold"
                disabled={isLoading || code.length < 6}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  'Continue'
                )}
              </Button>
            </form>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || isLoading}
              className={cn(
                'text-sm underline mt-4',
                resendCooldown > 0 || isLoading
                  ? 'text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              )}
            >
              {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
            </button>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2" role="alert">
                {error}
              </p>
            )}
          </>
        )}
    </div>
  )

  const isDark = theme === 'dark'

  if (isDesktop) {
    return (
      <Modal
        open={open}
        onClose={handleClose}
        size="medium"
        overlayClassName="z-[80]"
        theme={theme}
        className={cn(
          'max-w-md border-neutral-200 shadow-xl',
          isDark ? 'dark border-neutral-700' : 'bg-white'
        )}
      >
        {content}
      </Modal>
    )
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      side="bottom"
      overlayClassName="z-[80]"
      theme={theme}
      className={cn(
        'max-h-[90vh] rounded-t-2xl border-t border-neutral-200',
        isDark ? 'dark border-neutral-700' : 'bg-white'
      )}
    >
      {content}
    </Sheet>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}
