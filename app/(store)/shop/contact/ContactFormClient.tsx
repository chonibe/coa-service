'use client'

import { useState, FormEvent } from 'react'
import { ScrollReveal } from '@/components/blocks'
import { getStorePageContent } from '@/lib/content/site-content'

interface ContactFormClientProps {
  contactEmail: string
}

const contactContent = getStorePageContent('contact')

export function ContactFormClient({ contactEmail }: ContactFormClientProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/shop/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ScrollReveal animation="fadeUp" delay={0.2} duration={0.8}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
            {contactContent.form.fields.name.label}
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-experience-highlight"
            placeholder={contactContent.form.fields.name.placeholder}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
            {contactContent.form.fields.email.label}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-experience-highlight"
            placeholder={contactContent.form.fields.email.placeholder}
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1">
            {contactContent.form.fields.subject.label}
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-experience-highlight"
            placeholder={contactContent.form.fields.subject.placeholder}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
            {contactContent.form.fields.message.label}
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-experience-highlight"
            placeholder={contactContent.form.fields.message.placeholder}
            rows={5}
          />
        </div>

        {submitStatus === 'success' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
            {contactContent.form.messages.success.body}
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {contactContent.form.messages.error(contactEmail)}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-2 bg-foreground text-background font-medium rounded hover:bg-foreground/90 disabled:opacity-50 transition"
        >
          {isSubmitting ? contactContent.form.messages.submitLoading : contactContent.form.messages.submitIdle}
        </button>
      </form>
    </ScrollReveal>
  )
}
