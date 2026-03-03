'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Container } from './Container'

import { openTawkChat } from '@/lib/tawk'
import { PaymentIcons } from './PaymentIcons'
import { Input } from './Input'
import { Button } from './Button'
import { ScrollReveal } from '@/components/blocks'

/**
 * Impact Theme Footer
 * 
 * Enhanced with GSAP scroll animations:
 * - Sections stagger in on scroll
 * - Subtle parallax on newsletter section
 */

export interface FooterLink {
  label: string
  href: string
}

export interface FooterSection {
  title: string
  links: FooterLink[]
}

export interface FooterProps {
  logo?: React.ReactNode
  tagline?: string
  aboutTitle?: string
  aboutText?: string
  sections?: FooterSection[]
  newsletterEnabled?: boolean
  newsletterTitle?: string
  newsletterDescription?: string
  onNewsletterSubmit?: (email: string) => Promise<void>
  copyrightText?: string
  legalLinks?: FooterLink[]
  showPaymentIcons?: boolean
  className?: string
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  (
    {
      logo,
      tagline,
      aboutTitle,
      aboutText,
      sections = [],
      newsletterEnabled = true,
      newsletterTitle = 'Sign up for new stories and personal offers',
      newsletterDescription = '',
      onNewsletterSubmit,
      copyrightText,
      legalLinks = [],
      showPaymentIcons = true,
      className,
    },
    ref
  ) => {
    const [email, setEmail] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [submitted, setSubmitted] = React.useState(false)
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!email) return
      
      setLoading(true)
      try {
        if (onNewsletterSubmit) {
          await onNewsletterSubmit(email)
        }
        setSubmitted(true)
        setEmail('')
      } catch (error) {
        console.error('Newsletter signup failed:', error)
      } finally {
        setLoading(false)
      }
    }
    
    const currentYear = new Date().getFullYear()
    
    return (
      <footer
        ref={ref}
        className={cn(
          'bg-[#390000]', // Impact theme footer background
          'text-[#ffba94]', // Impact theme footer text
          newsletterEnabled ? 'pt-3 pb-8 sm:pt-4' : 'pt-12 pb-8 sm:pt-16',
          className
        )}
      >
        <Container maxWidth="default" paddingX="gutter">
          {/* Newsletter signup - above FOLLOW US section, centered, narrower width */}
          {newsletterEnabled && (
            <div className="py-6 border-b border-[#ffba94]/10 max-w-2xl mx-auto flex flex-row flex-wrap sm:flex-nowrap items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <h3 className="font-heading text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
                  {newsletterTitle}
                </h3>
                {newsletterDescription && (
                  <p className="text-sm text-[#ffba94]/70 hidden sm:block">
                    {newsletterDescription}
                  </p>
                )}
              </div>
              {submitted ? (
                <p className="text-sm text-[#00a341]">
                  Thanks for subscribing!
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="flex items-center gap-2 min-w-[200px]">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail"
                    required
                    className={cn(
                      'flex-1 h-10 px-4 min-w-0 text-sm leading-none',
                      'bg-[#ffba94]/10 text-[#ffba94] placeholder:text-[#ffba94]/50',
                      'border border-[#ffba94]/20',
                      'rounded-full',
                      'focus:outline-none focus:ring-2 focus:ring-[#ffba94]/50 focus:border-transparent',
                      'transition-all duration-200',
                      'box-border'
                    )}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    aria-label="Subscribe"
                    className={cn(
                      'h-10 w-10 flex items-center justify-center shrink-0 rounded-full',
                      'bg-[#ffba94] text-[#390000]',
                      'rounded-full',
                      'hover:opacity-90',
                      'disabled:opacity-50',
                      'transition-opacity duration-200'
                    )}
                  >
                    {loading ? (
                      <span className="text-sm">...</span>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Main footer content - 4 column layout with stagger animation */}
          <ScrollReveal animation="stagger" staggerAmount={0.1} start="top 90%">
            <div className={cn('grid gap-10 sm:gap-8 lg:grid-cols-12 lg:gap-12', newsletterEnabled && 'pt-8')}>
              {/* Navigation sections */}
              <div className={cn(aboutTitle ? 'lg:col-span-8' : 'lg:col-span-12')}>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-10 sm:gap-8 lg:gap-12">
                  {sections.map((section) => (
                    <div key={section.title}>
                      <h3 className="font-heading text-sm font-semibold uppercase tracking-wider mb-5">
                        {section.title}
                      </h3>
                      <ul className="space-y-3">
                        {(section.links || []).map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              className="text-sm text-[#ffba94]/70 hover:text-[#ffba94] transition-colors"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {/* Need Help quadrant - opens Tawk chat */}
                  <div>
                    <h3 className="font-heading text-sm font-semibold uppercase tracking-wider mb-5">
                      Need Help?
                    </h3>
                    <p className="text-sm text-[#ffba94]/70 mb-5">
                      Talk to our real support team every day 7am to midnight EST
                    </p>
                    <button
                      type="button"
                      onClick={openTawkChat}
                      className={cn(
                        'inline-flex items-center justify-center',
                        'px-5 py-2.5 rounded-full',
                        'bg-[#ffba94] text-[#390000]',
                        'text-sm font-medium',
                        'hover:opacity-90 transition-opacity'
                      )}
                    >
                      Chat with Us
                    </button>
                  </div>
                </div>
            </div>
            
              {/* About Section - optional */}
              {aboutTitle && (
              <div className="lg:col-span-4">
                <h3 className="font-heading text-sm font-semibold uppercase tracking-wider mb-5">
                  {aboutTitle}
                </h3>
                {(aboutText || tagline) && (
                  <p className="text-sm text-[#ffba94]/70 leading-relaxed">
                    {aboutText || tagline}
                  </p>
                )}
              </div>
              )}
            </div>
          </ScrollReveal>
          
          {/* Payment Icons */}
          {showPaymentIcons && (
            <div className={cn('pt-10 pb-2 border-t border-[#ffba94]/10', newsletterEnabled ? 'mt-10' : 'mt-12')}>
              <PaymentIcons className="text-[#ffba94]/90" />
            </div>
          )}
          
          {/* Bottom bar - Copyright and Legal links */}
          <div className="mt-10 pt-8 border-t border-[#ffba94]/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-[#ffba94]/80">
                {copyrightText || `© ${currentYear} Street Collector`}
              </p>
              
              {legalLinks.length > 0 && (
                <nav className="flex flex-wrap gap-4" aria-label="Legal">
                  {legalLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-xs text-[#ffba94]/80 hover:text-[#ffba94] transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          </div>
        </Container>
      </footer>
    )
  }
)
Footer.displayName = 'Footer'

/**
 * Simple footer for minimal pages
 */
export interface SimpleFooterProps {
  copyrightText?: string
  className?: string
}

const SimpleFooter = React.forwardRef<HTMLElement, SimpleFooterProps>(
  ({ copyrightText, className }, ref) => {
    const currentYear = new Date().getFullYear()
    
    return (
      <footer
        ref={ref}
        className={cn(
          'bg-[#390000] text-[#ffba94]',
          'py-6',
          className
        )}
      >
        <Container maxWidth="default" paddingX="gutter">
          <p className="text-xs text-[#ffba94]/80 text-center">
            {copyrightText || `© ${currentYear} Street Collector. All rights reserved.`}
          </p>
        </Container>
      </footer>
    )
  }
)
SimpleFooter.displayName = 'SimpleFooter'

export { Footer, SimpleFooter }
