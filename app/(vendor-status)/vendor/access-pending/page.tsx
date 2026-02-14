"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clock, Mail, ArrowLeft } from "lucide-react"

export default function AccessPendingPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const response = await fetch("/api/vendor/profile", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setEmail(data.vendor?.contact_email || null)
        }
      } catch {
        // Silently fail - email is optional display info
      }
    }
    fetchEmail()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border-0 p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-full flex items-center justify-center">
              <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Application Under Review
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              We&apos;re reviewing your vendor application. This usually takes 1-2 business days.
            </p>
          </div>

          {/* Email info */}
          {email && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-500 shrink-0" />
              <div className="text-left">
                <p className="text-xs text-slate-500 dark:text-slate-400">Logged in as</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{email}</p>
              </div>
            </div>
          )}

          {/* Info message */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              You&apos;ll receive an email notification once your account has been approved. 
              No further action is needed from your end.
            </p>
          </div>

          {/* Back button */}
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
