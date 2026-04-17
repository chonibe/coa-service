"use client"

import { useState } from "react"
import Link from "next/link"
import { Container, SectionWrapper, Input, Textarea, Button } from "@/components/impact"
import { ScrollReveal } from "@/components/blocks"
import { SUPPORT_EMAIL, supportMailto } from "@/lib/constants/support"

type Status = "idle" | "loading" | "success" | "error"

export default function ApplyPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    instagram: "",
    portfolio: "",
    bio: "",
  })
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string>("")

  const disabled = status === "loading"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setError("")
    try {
      const res = await fetch("/api/artists/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          instagram: form.instagram.trim() || undefined,
          portfolio: form.portfolio.trim() || undefined,
          bio: form.bio.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus("error")
        setError(data.error || "Something went wrong. Please try again.")
        return
      }
      setStatus("success")
    } catch {
      setStatus("error")
      setError("We couldn't reach the server. Please try again in a moment.")
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50 mb-6">
              Apply
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-6">
              Tell us about your work.
            </h1>
            <p className="font-body text-[#1a1a1a]/70 leading-relaxed max-w-xl mb-10">
              We read every application. Share links to work we should see and
              anything that helps us understand what you&apos;re making right now.
            </p>
          </ScrollReveal>

          {status === "success" ? (
            <ScrollReveal animation="fadeUp" duration={0.6}>
              <div className="max-w-xl rounded-xl bg-[#00a341]/10 border border-[#00a341]/30 p-8">
                <h2 className="font-heading text-xl font-semibold text-[#00a341] mb-3">
                  Thank you — we&apos;ve got it.
                </h2>
                <p className="font-body text-[#1a1a1a]/80 mb-6">
                  We typically reply within two weeks from {SUPPORT_EMAIL}. If you
                  don&apos;t see a response, check your spam folder or write to us directly.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/for-artists"
                    className="font-body text-sm font-medium text-[#1a1a1a] underline underline-offset-4"
                  >
                    Back to artist portal
                  </Link>
                  <a
                    href={supportMailto("Follow-up on my artist application")}
                    className="font-body text-sm font-medium text-[#1a1a1a] underline underline-offset-4"
                  >
                    Email {SUPPORT_EMAIL}
                  </a>
                </div>
              </div>
            </ScrollReveal>
          ) : (
            <ScrollReveal animation="fadeUp" delay={0.1} duration={0.8}>
              <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                <Input
                  label="Name"
                  required
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={disabled}
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  disabled={disabled}
                />
                <Input
                  label="Instagram"
                  placeholder="@yourhandle"
                  value={form.instagram}
                  onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                  disabled={disabled}
                />
                <Input
                  label="Portfolio site (optional)"
                  type="url"
                  placeholder="https://"
                  value={form.portfolio}
                  onChange={(e) => setForm((f) => ({ ...f, portfolio: e.target.value }))}
                  disabled={disabled}
                />
                <Textarea
                  label="Short bio"
                  placeholder="A paragraph or two about your practice."
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  disabled={disabled}
                  rows={5}
                />
                <p className="font-body text-xs text-[#1a1a1a]/50">
                  Please share either an Instagram handle or a portfolio link so we can see your work.
                </p>
                {error && <p className="font-body text-sm text-[#f83a3a]">{error}</p>}
                <Button type="submit" variant="primary" size="lg" disabled={disabled}>
                  {status === "loading" ? "Sending…" : "Send application"}
                </Button>
              </form>
            </ScrollReveal>
          )}
        </Container>
      </SectionWrapper>
    </main>
  )
}
