"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface AuthShellProps {
  title: string
  description?: string
  children: ReactNode
  heroTitle?: string
  heroSubtitle?: string
  className?: string
  footer?: ReactNode
}

/**
 * Provides a shared layout for vendor/admin authentication screens.
 * Renders a split layout with a branded hero and a centered card surface.
 */
export function AuthShell({
  title,
  description,
  children,
  heroTitle = "Street Collector Vendor Portal",
  heroSubtitle = "Streamlined access for vendors and administrators.",
  className,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:flex-row">
        <aside className="flex flex-1 flex-col justify-between gap-8 p-8 lg:p-12">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-[0.2em] text-white/80 shadow-lg shadow-cyan-500/10 backdrop-blur">
              Vendor Access
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-white lg:text-5xl">{heroTitle}</h1>
              <p className="max-w-lg text-base text-white/80 lg:text-lg">{heroSubtitle}</p>
            </div>
          </div>

          <div className="grid w-full gap-4 text-sm text-white/70 md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur">
              <h2 className="font-medium text-white">Secure sessions</h2>
              <p className="mt-2">
                Every login is signed & isolated to your organization. Admins may safely review vendor data.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur">
              <h2 className="font-medium text-white">Fast onboarding</h2>
              <p className="mt-2">
                Pair new Google accounts or invite vendors with one click from the admin tools.
              </p>
            </div>
          </div>
        </aside>

        <main className="relative flex flex-1 items-center justify-center bg-white px-6 py-16 text-slate-900 shadow-2xl shadow-cyan-500/10 lg:min-h-screen lg:px-12">
          <div className="pointer-events-none absolute inset-x-6 top-6 z-10 flex items-center justify-between text-xs font-medium uppercase tracking-[0.3em] text-slate-400 lg:top-10">
            <span>Street Collector</span>
            <span>Secure Login</span>
          </div>
          <div
            className={cn(
              "w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur",
              className,
            )}
          >
            <header className="space-y-3 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
              {description && <p className="text-base text-slate-600">{description}</p>}
            </header>

            <div className="space-y-6">{children}</div>

            {footer ? (
              <div className="border-t border-slate-100 pt-6 text-sm text-slate-500">{footer}</div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}


