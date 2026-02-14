"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShieldX, Mail, ArrowLeft } from "lucide-react"

export default function AccessDeniedPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border-0 p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center">
              <ShieldX className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Account Suspended
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Your vendor account has been suspended. If you believe this is an error, please contact our support team.
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

          {/* Contact support */}
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left">
            <p className="text-sm text-red-800 dark:text-red-300">
              For questions about your account status, please reach out to us at{" "}
              <a
                href="mailto:support@streetcollector.com"
                className="font-medium underline hover:no-underline"
              >
                support@streetcollector.com
              </a>
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
