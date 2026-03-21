'use client'

import * as React from 'react'
import Link from 'next/link'
import { FaFacebook, FaInstagram, FaPinterest, FaTiktok } from 'react-icons/fa6'
import { cn } from '@/lib/utils'
import { Container } from './Container'

import { openTawkChat } from '@/lib/tawk'
import { PaymentIcons } from './PaymentIcons'
import { socialLinks as themeSocialLinks } from '@/lib/design-system/tokens'

/**
 * Impact Theme Footer
 *
 * Mobile: single centered column — FOLLOW US (or footer blocks where every link is a known
 * social network) as one horizontal row of icon-only links, not stacked text.
 * Other sections are flat blocks with top borders (no accordion).
 * Desktop: multi-column grid; social rows use flex-nowrap so icons stay on one line.
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

const footerLinkClassDesktop =
  'text-sm text-[#ffba94]/70 hover:text-[#ffba94] transition-colors'

const footerLinkClassMobileStack = cn(
  'inline-flex min-h-11 w-full max-w-xs items-center justify-center rounded-full px-4 text-sm text-[#ffba94]/85 transition-colors',
  'hover:text-[#ffba94] active:bg-[#ffba94]/5'
)

const socialIconButtonClass = cn(
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ffba94]/25',
  'bg-[#ffba94]/10 text-[#ffba94] transition-colors',
  'hover:border-[#ffba94]/40 hover:bg-[#ffba94]/15'
)

function socialIconElementForLabel(label: string): React.ReactElement | null {
  const key = label.toLowerCase()
  if (key.includes('instagram')) return <FaInstagram className="h-5 w-5 shrink-0" aria-hidden />
  if (key.includes('facebook')) return <FaFacebook className="h-5 w-5 shrink-0" aria-hidden />
  if (key.includes('tiktok')) return <FaTiktok className="h-5 w-5 shrink-0" aria-hidden />
  if (key.includes('pinterest')) return <FaPinterest className="h-5 w-5 shrink-0" aria-hidden />
  return null
}

/** True when every link maps to a known social icon (Shopify menus sometimes omit "FOLLOW US" in the title). */
function isSocialIconsOnlySection(section: FooterSection): boolean {
  const links = section.links || []
  if (links.length === 0) return false
  return links.every((link) => socialIconElementForLabel(link.label) != null)
}

function shouldRenderSocialIconRow(section: FooterSection): boolean {
  if (section.title.trim().toUpperCase() === 'FOLLOW US') return true
  return isSocialIconsOnlySection(section)
}

/** Prefer theme token URLs for Instagram/Facebook when labels match. */
function resolveSocialHref(label: string, fallback: string): string {
  const key = label.toLowerCase()
  if (key.includes('instagram')) return themeSocialLinks.instagram
  if (key.includes('facebook')) return themeSocialLinks.facebook
  return fallback
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

    const followUsSection = sections.find(
      (s) => s.title.trim().toUpperCase() === 'FOLLOW US'
    )
    const linkSections = sections.filter(
      (s) => s.title.trim().toUpperCase() !== 'FOLLOW US'
    )

    const renderSectionLinks = (
      section: FooterSection,
      variant: 'desktop' | 'mobile-stack' | 'social-icons-row'
    ) => {
      const links = section.links || []
      if (variant === 'social-icons-row') {
        return (
          <ul className="flex flex-row flex-nowrap items-center justify-center gap-2 sm:justify-start sm:gap-3">
            {links.map((link) => {
              const external = /^https?:\/\//i.test(link.href)
              const href = resolveSocialHref(link.label, link.href)
              const icon = socialIconElementForLabel(link.label)
              if (!icon) {
                return (
                  <li key={link.href}>
                    <Link
                      href={href}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className={footerLinkClassDesktop}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              }
              return (
                <li key={link.href}>
                  <Link
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className={socialIconButtonClass}
                    aria-label={link.label}
                  >
                    {icon}
                  </Link>
                </li>
              )
            })}
          </ul>
        )
      }

      return (
        <ul className={variant === 'desktop' ? 'space-y-3' : 'flex flex-col items-center gap-2'}>
          {links.map((link) => {
            const external = /^https?:\/\//i.test(link.href)
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={
                    variant === 'desktop' ? footerLinkClassDesktop : footerLinkClassMobileStack
                  }
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
      )
    }

    return (
      <footer
        ref={ref}
        className={cn(
          'bg-[#251212]',
          'text-[#ffba94]',
          'mt-0 flex-shrink-0 -mt-8 sm:mt-0',
          newsletterEnabled ? 'pt-3 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-8 sm:pt-4' : 'pt-12 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-8 sm:pt-16',
          className
        )}
      >
        <Container maxWidth="default" paddingX="gutter">
          {newsletterEnabled && (
            <div
              className={cn(
                'mx-auto flex max-w-2xl flex-col items-center gap-6 border-b border-[#ffba94]/10 py-6 text-center',
                'sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:text-left'
              )}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <h3 className="font-heading text-sm font-semibold uppercase tracking-wider">
                  {newsletterTitle}
                </h3>
                {newsletterDescription && (
                  <p className="hidden text-sm text-[#ffba94]/70 sm:block">{newsletterDescription}</p>
                )}
              </div>
              {submitted ? (
                <p className="text-sm text-[#00a341]">Thanks for subscribing!</p>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex w-full max-w-md items-center gap-2 sm:min-w-[200px] sm:w-auto"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail"
                    required
                    className={cn(
                      'box-border h-10 min-w-0 flex-1 rounded-full border border-[#ffba94]/20 bg-[#ffba94]/10 px-4 text-sm leading-none text-[#ffba94] placeholder:text-[#ffba94]/50',
                      'transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ffba94]/50'
                    )}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    aria-label="Subscribe"
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffba94] text-[#390000]',
                      'transition-opacity hover:opacity-90 disabled:opacity-50'
                    )}
                  >
                    {loading ? (
                      <span className="text-sm">...</span>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className={cn('lg:grid lg:grid-cols-12 lg:gap-12', newsletterEnabled && 'pt-8')}>
            <div className={cn(aboutTitle ? 'lg:col-span-8' : 'lg:col-span-12')}>
              {/* Mobile: centered column, bordered blocks */}
              <div className="flex w-full flex-col items-center sm:hidden">
                {socialFooterSection ? (
                  <div className="w-full max-w-sm px-2 pb-12 text-center">
                    <h3 className="mb-4 font-heading text-xs font-semibold uppercase tracking-wider text-[#ffba94]">
                      {socialFooterSection.title}
                    </h3>
                    {renderSectionLinks(socialFooterSection, 'social-icons-row')}
                  </div>
                ) : null}
                {linkSections.map((section, idx) => (
                  <div
                    key={`m-${section.title}-${idx}`}
                    className="w-full max-w-sm border-t border-[#ffba94]/20 px-2 py-10 text-center"
                  >
                    <nav className="flex flex-col items-center" aria-labelledby={`footer-m-${idx}`}>
                      <h3
                        id={`footer-m-${idx}`}
                        className="mb-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#ffba94]"
                      >
                        {section.title}
                      </h3>
                      {renderSectionLinks(
                        section,
                        shouldRenderSocialIconRow(section) ? 'social-icons-row' : 'mobile-stack'
                      )}
                    </nav>
                  </div>
                ))}
                <div className="flex w-full max-w-sm flex-col items-center border-t border-[#ffba94]/20 px-2 py-10 text-center">
                  <h3 className="mb-2 font-heading text-xs font-semibold uppercase tracking-wider text-[#ffba94]">
                    Need help?
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-[#ffba94]/75">
                    Talk to our real support team every day 7am to midnight EST
                  </p>
                  <button
                    type="button"
                    onClick={openTawkChat}
                    className={cn(
                      'flex min-h-12 w-full max-w-sm items-center justify-center rounded-full bg-[#ffba94] px-5 text-base font-semibold text-[#390000]',
                      'transition-opacity hover:opacity-90 active:opacity-95'
                    )}
                  >
                    Chat with us
                  </button>
                </div>
              </div>

              {/* Desktop: original grid */}
              <div className="hidden grid-cols-4 gap-8 sm:grid lg:gap-12">
                {sections.map((section) => (
                  <div key={section.title} className="min-w-0">
                    <h3 className="font-heading mb-5 text-sm font-semibold uppercase tracking-wider">
                      {section.title}
                    </h3>
                    {shouldRenderSocialIconRow(section)
                      ? renderSectionLinks(section, 'social-icons-row')
                      : renderSectionLinks(section, 'desktop')}
                  </div>
                ))}
                <div>
                  <h3 className="font-heading mb-5 text-sm font-semibold uppercase tracking-wider">
                    Need Help?
                  </h3>
                  <p className="mb-5 text-sm text-[#ffba94]/70">
                    Talk to our real support team every day 7am to midnight EST
                  </p>
                  <button
                    type="button"
                    onClick={openTawkChat}
                    className={cn(
                      'inline-flex items-center justify-center rounded-full px-5 py-2.5',
                      'bg-[#ffba94] text-[#390000] text-sm font-medium transition-opacity hover:opacity-90'
                    )}
                  >
                    Chat with Us
                  </button>
                </div>
              </div>
            </div>

            {aboutTitle && (
              <div className="mt-10 hidden lg:col-span-4 lg:mt-0 lg:block">
                <h3 className="font-heading mb-5 text-sm font-semibold uppercase tracking-wider">
                  {aboutTitle}
                </h3>
                {(aboutText || tagline) && (
                  <p className="text-sm leading-relaxed text-[#ffba94]/70">{aboutText || tagline}</p>
                )}
              </div>
            )}
          </div>

          {showPaymentIcons && (
            <div
              className={cn(
                'border-t border-[#ffba94]/10 pb-2 pt-8 sm:pt-10',
                newsletterEnabled ? 'mt-8 sm:mt-10' : 'mt-10 sm:mt-12'
              )}
            >
              <PaymentIcons className="mx-auto max-w-full justify-center text-[#ffba94]/90 sm:mx-0 sm:justify-start" />
            </div>
          )}

          <div className="mt-8 border-t border-[#ffba94]/10 pt-8 sm:mt-10">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:text-left">
              <p className="text-sm text-[#ffba94]/80 sm:text-xs">
                {copyrightText || `© ${currentYear} Street Collector`}
              </p>

              {legalLinks.length > 0 && (
                <nav
                  className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:justify-end"
                  aria-label="Legal"
                >
                  {legalLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex min-h-11 items-center text-sm text-[#ffba94]/80 transition-colors hover:text-[#ffba94] sm:min-h-0 sm:text-xs"
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
        className={cn('bg-[#450000] py-6 text-[#ffba94]', className)}
      >
        <Container maxWidth="default" paddingX="gutter">
          <p className="text-center text-xs text-[#ffba94]/80">
            {copyrightText || `© ${currentYear} Street Collector. All rights reserved.`}
          </p>
        </Container>
      </footer>
    )
  }
)
SimpleFooter.displayName = 'SimpleFooter'

export { Footer, SimpleFooter }
