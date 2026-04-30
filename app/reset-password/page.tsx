"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Container, SectionWrapper, Input, Button } from "@/components/impact"
import { createClient, SUPABASE_BROWSER_ENV_HINT } from "@/lib/supabase/client"
import { SUPPORT_EMAIL, supportMailto } from "@/lib/constants/support"

type Status =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "invalid"; message: string }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string }

export default function ResetPasswordPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>({ kind: "loading" })
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    const supabase = createClient()

    // Supabase sends users back here with a hash fragment containing the
    // access/refresh tokens. Establish the session so updateUser works.
    const hash = window.location.hash
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.replace(/^#/, ""))
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")
      if (accessToken && refreshToken) {
        supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error }) => {
            if (error) {
              setStatus({
                kind: "invalid",
                message:
                  "This password reset link is no longer valid. Please request a new one from the sign-in page.",
              })
              return
            }
            // Clean the token out of the URL for safety
            window.history.replaceState({}, "", "/reset-password")
            setStatus({ kind: "ready" })
          })
        return
      }
    }

    // Otherwise check if we already have a recovery session (e.g. user reloaded)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus({ kind: "ready" })
      } else {
        setStatus({
          kind: "invalid",
          message:
            "This page is only reachable from a password reset email. Request a new link from the sign-in page if you need to reset your password.",
        })
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setStatus({ kind: "error", message: "Password must be at least 8 characters." })
      return
    }
    if (password !== confirm) {
      setStatus({ kind: "error", message: "Passwords don't match." })
      return
    }
    setStatus({ kind: "submitting" })
    const supabase = createClient()
    if (!supabase) {
      setStatus({ kind: "error", message: SUPABASE_BROWSER_ENV_HINT })
      return
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setStatus({ kind: "error", message: error.message })
      return
    }
    setStatus({ kind: "success" })
    setTimeout(() => {
      router.push("/login")
    }, 2500)
  }

  return (
    <main className="min-h-screen bg-white">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-4">
            Set a new password
          </h1>
          <p className="text-[#1a1a1a]/70 mb-10 max-w-md">
            Choose a new password for your account. You&apos;ll be signed in automatically once it&apos;s saved.
          </p>

          {status.kind === "loading" && (
            <p className="text-sm text-[#1a1a1a]/60">Checking your reset link…</p>
          )}

          {status.kind === "invalid" && (
            <div className="max-w-md space-y-4">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-sm text-amber-900">
                {status.message}
              </div>
              <div className="flex gap-3">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium underline underline-offset-4"
                >
                  Request a new link
                </Link>
                <span className="text-[#1a1a1a]/30">·</span>
                <a
                  href={supportMailto("Password reset help")}
                  className="text-sm font-medium underline underline-offset-4"
                >
                  Contact {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
          )}

          {status.kind === "success" && (
            <div className="max-w-md rounded-xl bg-[#00a341]/10 border border-[#00a341]/30 p-6">
              <p className="text-lg font-medium text-[#00a341] mb-2">Password updated.</p>
              <p className="text-[#1a1a1a]/80 text-sm">
                Taking you to the sign-in page now…
              </p>
            </div>
          )}

          {(status.kind === "ready" ||
            status.kind === "submitting" ||
            status.kind === "error") && (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
              <Input
                label="New password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={status.kind === "submitting"}
              />
              <Input
                label="Confirm password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repeat your new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={status.kind === "submitting"}
              />
              {status.kind === "error" && (
                <p className="text-sm text-[#f83a3a]">{status.message}</p>
              )}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={status.kind === "submitting"}
              >
                {status.kind === "submitting" ? "Saving…" : "Save new password"}
              </Button>
              <div>
                <Link
                  href="/login"
                  className="text-sm text-[#1a1a1a]/70 underline underline-offset-4"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </Container>
      </SectionWrapper>
    </main>
  )
}
