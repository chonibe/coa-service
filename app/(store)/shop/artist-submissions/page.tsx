'use client'

import { useState } from 'react'
import { Container, SectionWrapper, Input, Textarea, Button } from '@/components/impact'
import { ScrollReveal } from '@/components/blocks'

export default function ArtistSubmissionsPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    instagram: '',
    portfolio: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')
    try {
      const res = await fetch('/api/shop/artist-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formState.name.trim(),
          email: formState.email.trim(),
          instagram: formState.instagram.trim() || undefined,
          portfolio: formState.portfolio.trim() || undefined,
          message: formState.message.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.error || 'Failed to submit')
        return
      }
      setStatus('success')
      setFormState({ name: '', email: '', instagram: '', portfolio: '', message: '' })
    } catch {
      setStatus('error')
      setErrorMessage('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-8">
              Would You Like to Be Featured in Our Next Edition?
            </h1>
          </ScrollReveal>

          <ScrollReveal animation="fadeUp" delay={0.1} duration={0.8}>
            <div className="prose prose-lg max-w-none mb-12
              prose-headings:font-heading prose-headings:font-semibold prose-headings:text-[#1a1a1a]
              prose-p:text-[#1a1a1a]/80 prose-p:leading-relaxed
              prose-ul:text-[#1a1a1a]/80 prose-li:my-1
            ">
              <p className="mb-6">
                We&apos;re always on the lookout for bold, creative voices who challenge the status quo, push boundaries, and bring raw, powerful art to life. Whether you&apos;re an emerging artist or an established creator, this is your chance to have your work featured in our curated collection and displayed on lamps that bridge the gap between art, culture, and connection.
              </p>

              <h2 className="text-xl font-semibold text-[#1a1a1a] mt-8 mb-4">How to Get Involved</h2>
              <ol className="list-decimal list-inside space-y-2 text-[#1a1a1a]/80">
                <li><strong>Submit Your Details:</strong> Share your portfolio and tell us about your journey, your inspiration, and why your work belongs in The Street Lamp collection.</li>
                <li><strong>Enter Open Calls & Competitions:</strong> Stay tuned for opportunities to showcase your art in special edition collections or be featured as a highlighted artist.</li>
                <li><strong>Be Part of Something Bigger:</strong> If selected, your art will be celebrated by a global community of seekers, collectors, and creators who value authenticity and connection.</li>
              </ol>

              <h2 className="text-xl font-semibold text-[#1a1a1a] mt-8 mb-4">What We&apos;re Looking For</h2>
              <ul className="list-disc list-inside space-y-1 text-[#1a1a1a]/80">
                <li>Unique styles and fresh perspectives.</li>
                <li>Art that tells a story or sparks a connection.</li>
                <li>Work rooted in authenticity, creativity, and raw expression.</li>
              </ul>
              <p className="mt-6">
                We believe art is about more than just aesthetics—it&apos;s about bridging the gap between people, cultures, and experiences. If your work embodies this vision, we want to hear from you.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fadeUp" delay={0.2} duration={0.8}>
            {status === 'success' ? (
              <div className="rounded-xl bg-[#00a341]/10 border border-[#00a341]/30 p-8 text-center">
                <p className="text-lg font-medium text-[#00a341] mb-2">Thank you for your submission!</p>
                <p className="text-[#1a1a1a]/80">We&apos;ll review your portfolio and get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                <Input
                  label="Name"
                  required
                  placeholder="Your name"
                  value={formState.name}
                  onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                  disabled={status === 'loading'}
                />
                <Input
                  label="E-mail"
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={formState.email}
                  onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                  disabled={status === 'loading'}
                />
                <Input
                  label="Instagram"
                  placeholder="@yourhandle"
                  value={formState.instagram}
                  onChange={(e) => setFormState((s) => ({ ...s, instagram: e.target.value }))}
                  disabled={status === 'loading'}
                />
                <Input
                  label="Portfolio site (if you have one)"
                  type="url"
                  placeholder="https://"
                  value={formState.portfolio}
                  onChange={(e) => setFormState((s) => ({ ...s, portfolio: e.target.value }))}
                  disabled={status === 'loading'}
                />
                <Textarea
                  label="Message"
                  required
                  placeholder="Tell us about your journey, inspiration, and why your work belongs in The Street Lamp collection."
                  value={formState.message}
                  onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                  disabled={status === 'loading'}
                  rows={5}
                />
                {errorMessage && (
                  <p className="text-sm text-[#f83a3a]">{errorMessage}</p>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Sending...' : 'Send message'}
                </Button>
              </form>
            )}
          </ScrollReveal>

        </Container>
      </SectionWrapper>
    </main>
  )
}
