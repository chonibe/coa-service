'use client'

import { useState, FormEvent } from 'react'
import { ScrollReveal } from '@/components/blocks'

interface ContactFormClientProps {
  contactEmail: string
}

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
          <label htmlFor="name" className="block text-sm font-medium text-[#1a1a1a] mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-[#1a1a1a]/20 rounded bg-white text-[#1a1a1a] placeholder-[#1a1a1a]/50 focus:outline-none focus:border-[#047AFF]"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#1a1a1a] mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-[#1a1a1a]/20 rounded bg-white text-[#1a1a1a] placeholder-[#1a1a1a]/50 focus:outline-none focus:border-[#047AFF]"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-[#1a1a1a] mb-1">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-[#1a1a1a]/20 rounded bg-white text-[#1a1a1a] placeholder-[#1a1a1a]/50 focus:outline-none focus:border-[#047AFF]"
            placeholder="What is this about?"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-[#1a1a1a] mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-[#1a1a1a]/20 rounded bg-white text-[#1a1a1a] placeholder-[#1a1a1a]/50 focus:outline-none focus:border-[#047AFF]"
            placeholder="Tell us what's on your mind..."
            rows={5}
          />
        </div>

        {submitStatus === 'success' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
            ✓ Thank you! We&apos;ve received your message and will get back to you soon.
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            Something went wrong. Please try emailing us directly at {contactEmail}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-2 bg-[#1a1a1a] text-white font-medium rounded hover:bg-[#1a1a1a]/90 disabled:opacity-50 transition"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </ScrollReveal>
  )
}
