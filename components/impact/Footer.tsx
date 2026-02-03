'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Container } from './Container'
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

export interface SocialLink {
  platform: 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'tiktok' | 'pinterest'
  href: string
}

export interface FooterProps {
  logo?: React.ReactNode
  tagline?: string
  aboutTitle?: string
  aboutText?: string
  sections?: FooterSection[]
  socialLinks?: SocialLink[]
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
      aboutTitle = 'About',
      aboutText,
      sections = [],
      socialLinks = [],
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
          'pt-12 pb-8 sm:pt-16',
          className
        )}
      >
        <Container maxWidth="default" paddingX="gutter">
          {/* Main footer content - 4 column layout with stagger animation */}
          <ScrollReveal animation="stagger" staggerAmount={0.1} start="top 90%">
            <div className="grid gap-10 sm:gap-8 lg:grid-cols-12 lg:gap-12">
              
              {/* Newsletter Section */}
              {newsletterEnabled && (
                <div className="lg:col-span-4">
                  <h3 className="font-heading text-base font-semibold mb-4">
                    {newsletterTitle}
                  </h3>
                {newsletterDescription && (
                  <p className="text-sm text-[#ffba94]/70 mb-4">
                    {newsletterDescription}
                  </p>
                )}
                
                {submitted ? (
                  <p className="text-sm text-[#00a341]">
                    Thanks for subscribing!
                  </p>
                ) : (
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="E-mail"
                      required
                      className={cn(
                        'flex-1 h-11 px-4',
                        'bg-[#ffba94]/10 text-[#ffba94] placeholder:text-[#ffba94]/50',
                        'border border-[#ffba94]/20',
                        'rounded-full',
                        'text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-[#ffba94]/50 focus:border-transparent',
                        'transition-all duration-200'
                      )}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      aria-label="Subscribe"
                      className={cn(
                        'h-11 w-11 flex items-center justify-center',
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
              
              {/* Navigation sections - centered columns */}
              <div className="lg:col-span-4">
                <div className="grid grid-cols-2 gap-8">
                  {sections.map((section) => (
                    <div key={section.title}>
                      <h3 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4">
                        {section.title}
                    </h3>
                    <ul className="space-y-2.5">
                      {section.links.map((link) => (
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
              </div>
            </div>
            
              {/* About Section - right column */}
              <div className="lg:col-span-4">
                <h3 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4">
                  {aboutTitle}
                </h3>
                <p className="text-sm text-[#ffba94]/70 leading-relaxed mb-6">
                  {aboutText || tagline || 'In a world where art is often consumed on screens, The Street Lamp bridges the gap between the digital and the real, bringing art back into the physical world to be truly felt and experienced.'}
                </p>
                
                {/* Social links */}
                {socialLinks.length > 0 && (
                  <div className="flex gap-3">
                    {socialLinks.map((social) => (
                      <SocialIcon key={social.platform} {...social} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>
          
          {/* Payment Icons */}
          {showPaymentIcons && (
            <div className="mt-10 pt-8 border-t border-[#ffba94]/10">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <PaymentIconSVG name="visa" />
                <PaymentIconSVG name="mastercard" />
                <PaymentIconSVG name="amex" />
                <PaymentIconSVG name="discover" />
                <PaymentIconSVG name="diners" />
                <PaymentIconSVG name="shop-pay" />
                <PaymentIconSVG name="apple-pay" />
                <PaymentIconSVG name="google-pay" />
                <PaymentIconSVG name="paypal" />
              </div>
            </div>
          )}
          
          {/* Bottom bar - Copyright and Legal links */}
          <div className="mt-8 pt-6 border-t border-[#ffba94]/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-[#ffba94]/50">
                {copyrightText || `© ${currentYear} Street Collector. Powered by Shopify`}
              </p>
              
              {legalLinks.length > 0 && (
                <nav className="flex flex-wrap gap-4" aria-label="Legal">
                  {legalLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-xs text-[#ffba94]/50 hover:text-[#ffba94] transition-colors"
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
 * Social Icon component
 */
function SocialIcon({ platform, href }: SocialLink) {
  const icons: Record<string, React.ReactNode> = {
    facebook: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
    instagram: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
    twitter: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    youtube: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
      </svg>
    ),
    tiktok: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
    pinterest: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0a12 12 0 0 0-4.373 23.178c-.07-.63-.134-1.596.028-2.284.146-.624.943-3.998.943-3.998s-.24-.481-.24-1.192c0-1.116.647-1.95 1.453-1.95.686 0 1.016.515 1.016 1.133 0 .69-.44 1.722-.667 2.678-.19.802.402 1.457 1.193 1.457 1.432 0 2.532-1.51 2.532-3.69 0-1.93-1.387-3.278-3.369-3.278-2.295 0-3.642 1.721-3.642 3.502 0 .693.267 1.437.6 1.841a.24.24 0 0 1 .056.23c-.061.256-.198.802-.225.914-.035.146-.116.177-.268.107-1-.465-1.624-1.926-1.624-3.1 0-2.523 1.834-4.84 5.286-4.84 2.775 0 4.932 1.977 4.932 4.62 0 2.757-1.739 4.976-4.151 4.976-.811 0-1.573-.421-1.834-.919l-.498 1.902c-.181.695-.669 1.566-.995 2.097A12 12 0 1 0 12 0z" />
      </svg>
    ),
  }
  
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 text-[#ffba94]/70 hover:text-[#ffba94] transition-colors"
      aria-label={`Follow us on ${platform}`}
    >
      {icons[platform]}
    </a>
  )
}

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
          <p className="text-xs text-[#ffba94]/50 text-center">
            {copyrightText || `© ${currentYear} Street Collector. All rights reserved.`}
          </p>
        </Container>
      </footer>
    )
  }
)
SimpleFooter.displayName = 'SimpleFooter'

/**
 * Payment Icon component with SVG icons
 * Matches the exact payment icons from the live Shopify site
 */
function PaymentIconSVG({ name }: { name: string }) {
  // SVG payment icons matching common payment providers
  const icons: Record<string, React.ReactNode> = {
    visa: (
      <svg viewBox="0 0 38 24" fill="none" className="w-full h-full">
        <rect width="38" height="24" rx="3" fill="white"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M15.527 15.873H13.371L11.717 10.287C11.6382 10.0087 11.4821 9.77339 11.252 9.655C10.584 9.3 9.86095 9.02667 9.10095 8.87133V8.635H12.615C13.101 8.635 13.482 9.01 13.5387 9.46467L14.3737 13.7593L16.5243 8.635H18.624L15.527 15.873ZM19.8057 15.873H17.7617L19.4477 8.635H21.4917L19.8057 15.873ZM24.0203 10.5257C24.0773 10.0687 24.458 9.81067 24.8953 9.81067C25.562 9.75133 26.2833 9.87067 26.8933 10.167L27.274 8.81267C26.664 8.57667 26.001 8.45733 25.3943 8.45733C23.4117 8.45733 21.976 9.53133 21.976 11.0247C21.976 12.164 22.9837 12.7867 23.707 13.1607C24.458 13.534 24.724 13.79 24.6673 14.1633C24.6673 14.7193 24.0773 14.9753 23.4927 14.9753C22.7673 14.9753 22.0423 14.8 21.399 14.4527L21.0183 15.814C21.747 16.1287 22.533 16.2867 23.289 16.2867C25.4943 16.3487 26.8933 15.274 26.8933 13.6567C26.8933 11.6653 24.0203 11.5493 24.0203 10.5257ZM33.5 15.873L31.915 8.635H30.133C29.752 8.635 29.371 8.87133 29.2573 9.227L26.2923 15.873H28.3923L28.799 14.694H31.3553L31.595 15.873H33.5ZM30.447 10.7047L31.055 13.3893H29.352L30.447 10.7047Z" fill="#172B85"/>
      </svg>
    ),
    mastercard: (
      <svg viewBox="0 0 38 24" fill="none" className="w-full h-full">
        <rect width="38" height="24" rx="3" fill="white"/>
        <circle cx="15" cy="12" r="7" fill="#EB001B"/>
        <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M19 17.2C20.5601 15.9191 21.5 14.0619 21.5 12C21.5 9.93808 20.5601 8.08091 19 6.8C17.4399 8.08091 16.5 9.93808 16.5 12C16.5 14.0619 17.4399 15.9191 19 17.2Z" fill="#FF5F00"/>
      </svg>
    ),
    amex: (
      <svg viewBox="0 0 38 24" fill="none" className="w-full h-full">
        <rect width="38" height="24" rx="3" fill="#006FCF"/>
        <path d="M8 12H10L11 9.5L12 12H14L12 8H10L8 12Z" fill="white"/>
        <path d="M15 12V8H18V9H16.5V9.5H18V10.5H16.5V11H18V12H15Z" fill="white"/>
        <path d="M22 12L21.5 11H20V8H18.5V12H20.5L22 12Z" fill="white"/>
        <path d="M22.5 8H24L25.5 10V8H27V12H25.5L24 10V12H22.5V8Z" fill="white"/>
        <path d="M28 12V8H30V9H29V9.5H30V10.5H29V11H30V12H28Z" fill="white"/>
        <path d="M8 16V14H11V15H9.5V15.5H11V16H8Z" fill="white"/>
        <path d="M12 16V14H13.5L14 14.5L14.5 14H16V16H14.5V15.5L14 16L13.5 15.5V16H12Z" fill="white"/>
        <path d="M17 16V14H19.5V15H18.5V15.5H19.5V16H17Z" fill="white"/>
        <path d="M20 16V14H22.5V15H21.5V15.5H22.5V16H20Z" fill="white"/>
        <path d="M23.5 14V16H25V15.5L25.5 16H27L26 15L27 14H25.5L25 14.5V14H23.5Z" fill="white"/>
        <path d="M28 16V14H30V15H29V16H28Z" fill="white"/>
      </svg>
    ),
    discover: (
      <svg viewBox="0 0 38 24" fill="none" className="w-full h-full">
        <rect width="38" height="24" rx="3" fill="white"/>
        <rect x="1" y="1" width="36" height="22" rx="2" fill="#F47216"/>
        <ellipse cx="23" cy="12" rx="5" ry="4" fill="white"/>
        <path d="M6 10H8C9.1 10 10 10.9 10 12C10 13.1 9.1 14 8 14H6V10Z" fill="white"/>
        <path d="M11 10H13V14H11V10Z" fill="white"/>
        <path d="M14 12C14 10.9 14.9 10 16 10C17.1 10 17.5 10.5 17.5 10.5L17 11.5C17 11.5 16.7 11 16 11C15.4 11 15 11.4 15 12C15 12.6 15.4 13 16 13C16.7 13 17 12.5 17 12.5L17.5 13.5C17.5 13.5 17.1 14 16 14C14.9 14 14 13.1 14 12Z" fill="white"/>
        <path d="M27 10H29V11H28V11.5H29V12.5H28V13H29V14H27V10Z" fill="white"/>
        <path d="M30 14V10H32C32.6 10 33 10.4 33 11V11C33 11.3 32.8 11.5 32.5 11.7C32.8 11.9 33 12.3 33 12.5V13C33 13.6 32.6 14 32 14H30Z" fill="white"/>
      </svg>
    ),
    diners: (
      <svg viewBox="0 0 38 24" fill="none" className="w-full h-full">
        <rect width="38" height="24" rx="3" fill="white"/>
        <circle cx="19" cy="12" r="8" fill="#0079BE"/>
        <circle cx="15" cy="12" r="6" fill="white"/>
        <path d="M15 7V17C12.2 17 10 14.8 10 12C10 9.2 12.2 7 15 7Z" fill="#0079BE"/>
        <path d="M15 7V17C17.8 17 20 14.8 20 12C20 9.2 17.8 7 15 7Z" fill="#0079BE"/>
      </svg>
    ),
    'shop-pay': (
      <svg viewBox="0 0 38 24" fill="none" className="w-full h-full">
        <rect width="38" height="24" rx="3" fill="#5A31F4"/>
        <path d="M9 8.5C9 8.22386 9.22386 8 9.5 8H11.5C13.433 8 15 9.567 15 11.5C15 13.433 13.433 15 11.5 15H10V17H9V8.5ZM10 14H11.5C12.8807 14 14 12.8807 14 11.5C14 10.1193 12.8807 9 11.5 9H10V14Z" fill="white"/>
        <path d="M17 12C17 10.3431 18.3431 9 20 9C21.6569 9 23 10.3431 23 12C23 13.6569 21.6569 15 20 15C18.3431 15 17 13.6569 17 12ZM18 12C18 13.1046 18.8954 14 20 14C21.1046 14 22 13.1046 22 12C22 10.8954 21.1046 10 20 10C18.8954 10 18 10.8954 18 12Z" fill="white"/>
        <path d="M24 8.5C24 8.22386 24.2239 8 24.5 8H25.5C26.3284 8 27 8.67157 27 9.5C27 10.1531 26.5826 10.7087 26 10.9146V11H27V12H26V17H25V12H24.5C24.2239 12 24 11.7761 24 11.5V8.5ZM25 11H25.5C25.7761 11 26 10.7761 26 10.5V9.5C26 9.22386 25.7761 9 25.5 9H25V11Z" fill="white"/>
        <path d="M28 15.5C28 14.6716 28.6716 14 29.5 14C30.3284 14 31 14.6716 31 15.5C31 16.3284 30.3284 17 29.5 17C28.6716 17 28 16.3284 28 15.5Z" fill="white"/>
      </svg>
    ),
    'apple-pay': (
      <svg viewBox="0 0 38 24" fill="none" className="w-full h-full">
        <rect width="38" height="24" rx="3" fill="black"/>
        <path d="M13.77 7.5C13.17 8.2 12.27 8.75 11.42 8.68C11.32 7.83 11.72 6.93 12.27 6.28C12.87 5.58 13.85 5.08 14.6 5.03C14.68 5.93 14.35 6.8 13.77 7.5ZM14.59 8.85C13.39 8.78 12.37 9.58 11.8 9.58C11.23 9.58 10.33 8.9 9.38 8.92C8.13 8.95 6.98 9.68 6.36 10.83C5.08 13.13 6.03 16.58 7.28 18.43C7.88 19.35 8.6 20.35 9.55 20.33C10.45 20.3 10.8 19.73 11.9 19.73C12.98 19.73 13.3 20.33 14.25 20.3C15.23 20.28 15.85 19.38 16.45 18.45C17.15 17.4 17.43 16.38 17.45 16.33C17.43 16.3 15.4 15.5 15.38 13.13C15.35 11.15 16.98 10.2 17.05 10.15C16.15 8.8 14.75 8.85 14.59 8.85ZM21.58 6.38V20.18H23.83V15.23H27.03C29.95 15.23 32 13.23 32 10.8C32 8.38 29.98 6.38 27.1 6.38H21.58ZM23.83 8.28H26.48C28.45 8.28 29.7 9.43 29.7 10.8C29.7 12.18 28.45 13.33 26.48 13.33H23.83V8.28Z" fill="white"/>
      </svg>
    ),
    'google-pay': (
      <svg viewBox="0 0 38 24" fill="none" className="w-full h-full">
        <rect width="38" height="24" rx="3" fill="white"/>
        <path d="M17.992 12.0001V14.4001H17.145V8.80006H19.545C20.0996 8.79156 20.635 9.00206 21.035 9.38906C21.4475 9.75506 21.6725 10.2716 21.6575 10.8091C21.6725 11.3466 21.4475 11.8631 21.035 12.2291C20.635 12.6161 20.1006 12.8261 19.545 12.8181H17.992V12.0001ZM17.992 9.59006V12.0001H19.572C19.897 12.0121 20.2145 11.8841 20.444 11.6551C20.906 11.1816 20.906 10.4286 20.444 9.95506C20.216 9.72556 19.8985 9.59656 19.572 9.60906L17.992 9.59006Z" fill="#3C4043"/>
        <path d="M24.6775 10.6001C25.2485 10.5786 25.8015 10.8001 26.2075 11.2156C26.5985 11.6286 26.806 12.1851 26.785 12.7596V14.4001H25.9655V13.7601H25.9375C25.596 14.2916 24.9875 14.6011 24.3555 14.5646C23.859 14.5901 23.3735 14.4201 23.0045 14.0931C22.6625 13.7951 22.4715 13.3616 22.486 12.9101C22.4715 12.4611 22.6595 12.0286 23.0005 11.7271C23.386 11.4046 23.882 11.2401 24.3865 11.2656C24.885 11.2411 25.375 11.3851 25.7755 11.6736V11.4561C25.7805 11.1426 25.6555 10.8401 25.4285 10.6246C25.2035 10.4036 24.9 10.2816 24.585 10.2851C24.1005 10.2661 23.6545 10.5326 23.445 10.9696L22.6925 10.6546C23.0215 10.0026 23.7125 9.59556 24.453 9.60006C24.4655 9.60006 24.4775 9.60006 24.4895 9.60006C24.5525 9.59756 24.6155 9.59806 24.6775 10.6001ZM23.3555 12.9356C23.354 13.1546 23.4505 13.3636 23.618 13.5056C23.8075 13.6666 24.052 13.7516 24.302 13.7441C24.686 13.7456 25.0525 13.5861 25.3125 13.3056C25.5985 13.0221 25.7605 12.6381 25.762 12.2361C25.444 11.9891 25.049 11.8601 24.646 11.8701C24.3185 11.8661 23.999 11.9691 23.7385 12.1631C23.4895 12.3461 23.347 12.6346 23.356 12.9356H23.3555Z" fill="#3C4043"/>
        <path d="M32 9.76006L29.4495 16.0001H28.5595L29.5165 13.7601L27.637 9.76006H28.588L29.9695 12.8891L31.2955 9.76006H32Z" fill="#3C4043"/>
        <path d="M13.5725 11.3125C13.5725 10.9765 13.5435 10.6415 13.486 10.3115H10V12.176H12.0165C11.929 12.764 11.6085 13.293 11.125 13.6355V14.816H12.4085C13.135 14.1445 13.5725 13.162 13.5725 11.3125Z" fill="#4285F4"/>
        <path d="M10 15.9001C11.5745 15.9001 12.9035 15.3781 13.4085 14.8161L12.125 13.6356C11.6735 13.9441 11.091 14.1196 10 14.1196C8.5015 14.1196 7.22 13.1401 6.801 11.8001H5.4785V13.0156C6.0985 14.6941 7.9195 15.9001 10 15.9001Z" fill="#34A853"/>
        <path d="M6.801 11.8C6.5635 11.1315 6.5635 10.3985 6.801 9.73V8.5145H5.4785C4.816 9.7875 4.816 11.7425 5.4785 13.0155L6.801 11.8Z" fill="#FBBC04"/>
        <path d="M10 7.4105C11.1485 7.39 12.2555 7.8245 13.0875 8.6215L13.4445 8.2725L14.369 7.3605C13.078 6.1455 11.3545 5.5 10 5.6C7.9195 5.6 6.0985 6.806 5.4785 8.5145L6.801 9.73C7.22 8.39 8.5015 7.4105 10 7.4105Z" fill="#EA4335"/>
      </svg>
    ),
    paypal: (
      <svg viewBox="0 0 38 24" fill="none" className="w-full h-full">
        <rect width="38" height="24" rx="3" fill="white"/>
        <path d="M25.7 9.75C25.64 10.15 25.54 10.55 25.4 10.95C24.68 13.15 23.02 14.25 20.58 14.25H19.9C19.68 14.25 19.48 14.4 19.44 14.62L18.82 18.5C18.8 18.62 18.7 18.7 18.58 18.7H16.52C16.38 18.7 16.28 18.58 16.3 18.44L16.34 18.18L17.02 14.02L17.08 13.68C17.12 13.46 17.32 13.3 17.54 13.3H18.18C20.24 13.3 21.88 12.38 22.5 10.02C22.76 9.08 22.66 8.3 22.14 7.72C21.98 7.54 21.78 7.4 21.56 7.28C21.74 7.06 21.88 6.82 21.98 6.56C22.16 6.02 22.2 5.42 22.06 4.82C21.64 3.1 19.92 2.24 17.66 2.24H12.78C12.56 2.24 12.36 2.4 12.32 2.62L10.02 18.44C10 18.58 10.1 18.7 10.24 18.7H13.36L14.24 12.98L14.2 13.22C14.24 13 14.44 12.84 14.66 12.84H16.12C18.88 12.84 21.04 11.64 21.76 8.42C21.78 8.32 21.8 8.22 21.82 8.12C21.94 7.94 22.08 7.78 22.24 7.64C22.84 8.08 23.14 8.76 23.08 9.56C22.98 10.56 22.66 11.38 22.14 12.02C21.44 12.88 20.38 13.3 19.02 13.3H18.38C18.16 13.3 17.96 13.46 17.92 13.68L17.86 14.02L17.18 18.18L17.14 18.44C17.12 18.58 17.22 18.7 17.36 18.7H18.58C18.7 18.7 18.8 18.62 18.82 18.5L19.44 14.62C19.48 14.4 19.68 14.25 19.9 14.25H20.58C23.02 14.25 24.68 13.15 25.4 10.95C25.54 10.55 25.64 10.15 25.7 9.75Z" fill="#003087"/>
        <path d="M14.66 6.76C14.72 6.38 14.98 6.08 15.32 5.96C15.46 5.9 15.62 5.88 15.78 5.88H20.18C20.7 5.88 21.18 5.92 21.62 6.02C21.74 6.04 21.86 6.08 21.98 6.12C22.1 6.16 22.2 6.2 22.3 6.26C22.4 6.3 22.48 6.36 22.56 6.42C22.66 6.16 22.7 5.88 22.68 5.58C22.42 3.54 20.68 2.72 18.42 2.72H13.54C13.32 2.72 13.12 2.88 13.08 3.1L10.78 18.92C10.76 19.06 10.86 19.18 11 19.18H14.12L14.66 15.76L14.66 6.76Z" fill="#002F86"/>
        <path d="M22.56 6.42C22.64 6.78 22.68 7.16 22.66 7.56C22.22 11.3 19.64 12.84 16.12 12.84H14.66C14.44 12.84 14.24 13 14.2 13.22L13.36 18.52L13.1 20.18C13.08 20.32 13.18 20.44 13.32 20.44H16.3C16.48 20.44 16.64 20.3 16.68 20.12L16.72 19.9L17.26 16.54L17.32 16.26C17.36 16.08 17.52 15.94 17.7 15.94H18.22C21.26 15.94 23.58 14.72 24.36 11.14C24.68 9.62 24.54 8.36 23.78 7.48C23.54 7.2 23.24 6.98 22.9 6.8C22.8 6.66 22.68 6.54 22.56 6.42Z" fill="#0070E0"/>
        <path d="M21.58 6.02C21.42 5.98 21.26 5.94 21.08 5.9C20.9 5.88 20.72 5.86 20.52 5.84C20.02 5.8 19.48 5.78 18.9 5.78H15.86C15.72 5.78 15.6 5.82 15.48 5.9C15.24 6.02 15.06 6.26 15.02 6.54L14.68 8.8L14.58 9.42V9.44C14.62 9.22 14.82 9.06 15.04 9.06H16.36C19.4 9.06 21.72 7.84 22.5 4.26C22.52 4.16 22.54 4.06 22.56 3.96C22.4 3.88 22.22 3.8 22.02 3.74C21.88 3.7 21.72 3.66 21.58 3.62C21.58 3.62 21.58 5.66 21.58 6.02Z" fill="#003087"/>
        <path d="M15.02 6.54C15.06 6.26 15.24 6.02 15.48 5.9C15.6 5.82 15.72 5.78 15.86 5.78H18.9C19.48 5.78 20.02 5.8 20.52 5.84C20.72 5.86 20.9 5.88 21.08 5.9C21.26 5.94 21.42 5.98 21.58 6.02C21.66 6.04 21.74 6.06 21.82 6.1C22.08 6.18 22.32 6.28 22.56 6.42C22.64 5.72 22.56 5.22 22.24 4.88C21.88 4.48 21.22 4.28 20.36 4.28H15.48C15.26 4.28 15.06 4.44 15.02 4.66L13.42 15.22L13.38 15.52L14.58 9.42L14.68 8.8L15.02 6.54Z" fill="#001C64"/>
      </svg>
    ),
  }

  return (
    <div 
      className="w-10 h-6 sm:w-12 sm:h-7 rounded overflow-hidden"
      title={name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    >
      {icons[name] || (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600">
          {name.slice(0, 4).toUpperCase()}
        </div>
      )}
    </div>
  )
}

export { Footer, SimpleFooter }
