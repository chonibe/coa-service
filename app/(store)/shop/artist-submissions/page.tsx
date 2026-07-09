'use client'

import { useState } from 'react'
import { Container, SectionWrapper, Input, Textarea, Button } from '@/components/impact'
import { ScrollReveal } from '@/components/blocks'
import { getStorePageContent } from '@/lib/content/site-content'

const submissionsContent = getStorePageContent('artistSubmissions')

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
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.error || submissionsContent.form.messages.errorFallback || '')
        return
      }
      setStatus('success')
      setFormState({ name: '', email: '', instagram: '', portfolio: '', message: '' })
    } catch {
      setStatus('error')
      setErrorMessage(submissionsContent.form.messages.errorFallback || '')
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-[-0.02em] mb-8">
              {submissionsContent.hero.title}
            </h1>
          </ScrollReveal>

          <ScrollReveal animation="fadeUp" delay={0.1} duration={0.8}>
            <div className="prose prose-lg max-w-none mb-12
              prose-headings:font-heading prose-headings:font-semibold prose-headings:text-foreground
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-ul:text-muted-foreground prose-li:my-1
            ">
              {submissionsContent.intro.body.map((paragraph) => (
                <p key={paragraph} className="mb-6">{paragraph}</p>
              ))}

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">{submissionsContent.intro.howToTitle}</h2>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                {submissionsContent.intro.howToSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>

              <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">{submissionsContent.intro.lookingForTitle}</h2>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {submissionsContent.intro.lookingForItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-6">
                {submissionsContent.intro.closing}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fadeUp" delay={0.2} duration={0.8}>
            {status === 'success' ? (
              <div className="rounded-xl bg-[#00a341]/10 border border-[#00a341]/30 p-8 text-center">
                <p className="text-lg font-medium text-[#00a341] mb-2">{submissionsContent.form.messages.successTitle}</p>
                <p className="text-muted-foreground">{submissionsContent.form.messages.successBody}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                <Input
                  label={submissionsContent.form.fields.name.label}
                  required
                  placeholder={submissionsContent.form.fields.name.placeholder}
                  value={formState.name}
                  onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                  disabled={status === 'loading'}
                />
                <Input
                  label={submissionsContent.form.fields.email.label}
                  type="email"
                  required
                  placeholder={submissionsContent.form.fields.email.placeholder}
                  value={formState.email}
                  onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                  disabled={status === 'loading'}
                />
                <Input
                  label={submissionsContent.form.fields.instagram.label}
                  placeholder={submissionsContent.form.fields.instagram.placeholder}
                  value={formState.instagram}
                  onChange={(e) => setFormState((s) => ({ ...s, instagram: e.target.value }))}
                  disabled={status === 'loading'}
                />
                <Input
                  label={submissionsContent.form.fields.portfolio.label}
                  type="url"
                  placeholder={submissionsContent.form.fields.portfolio.placeholder}
                  value={formState.portfolio}
                  onChange={(e) => setFormState((s) => ({ ...s, portfolio: e.target.value }))}
                  disabled={status === 'loading'}
                />
                <Textarea
                  label={submissionsContent.form.fields.message.label}
                  required
                  placeholder={submissionsContent.form.fields.message.placeholder}
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
                  {status === 'loading'
                    ? submissionsContent.form.messages.submitLoading
                    : submissionsContent.form.messages.submitIdle}
                </Button>
              </form>
            )}
          </ScrollReveal>

        </Container>
      </SectionWrapper>
    </main>
  )
}
