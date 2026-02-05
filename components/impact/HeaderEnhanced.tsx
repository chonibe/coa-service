/**
 * Header Enhanced - Osmo-style Navigation
 * 
 * Features:
 * - Animated hamburger menu
 * - Dual logo (wordmark + icon)
 * - Rotating button animations
 * - Smooth line separator
 * - GSAP-powered interactions
 */

'use client'

import * as React from 'react'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { gsap } from '@/lib/animations/gsap-config'
import { useGSAP } from '@gsap/react'

export interface HeaderEnhancedProps {
  logoHref?: string
  onMenuClick?: () => void
  onLoginClick?: () => void
  onSignupClick?: () => void
  loginHref?: string
  signupHref?: string
  loginText?: string
  signupText?: string
  className?: string
}

export function HeaderEnhanced({
  logoHref = '/',
  onMenuClick,
  onLoginClick,
  onSignupClick,
  loginHref = '/login',
  signupHref = '/plans',
  loginText = 'Login',
  signupText = 'Join',
  className,
}: HeaderEnhancedProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  const handleMenuClick = () => {
    setMenuOpen(!menuOpen)
    onMenuClick?.()
  }

  return (
    <div 
      ref={navRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'bg-white/95 backdrop-blur-sm',
        className
      )}
    >
      <div className="nav-bar__top px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          {/* Menu Button */}
          <div className="nav-bar__menu flex-shrink-0">
            <button
              onClick={handleMenuClick}
              className={cn(
                'nav-menu flex items-center gap-2 group',
                'transition-all duration-300 hover:opacity-70'
              )}
              aria-label="Toggle menu"
            >
              <div className="nav-menu__hamburger relative w-6 h-5 flex flex-col justify-between">
                <div 
                  className={cn(
                    "nav-menu__hamburger-bar h-0.5 bg-[#1a1a1a] transition-all duration-300 origin-center",
                    menuOpen && "rotate-45 translate-y-2"
                  )}
                />
                <div 
                  className={cn(
                    "nav-menu__hamburger-bar h-0.5 bg-[#1a1a1a] transition-all duration-300",
                    menuOpen && "-rotate-45 -translate-y-2"
                  )}
                />
              </div>
              <span className="nav-menu__label text-sm font-medium text-[#1a1a1a] hidden sm:inline">
                Menu
              </span>
            </button>
          </div>

          {/* Logo */}
          <div className="nav-bar__logo absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link 
              href={logoHref}
              className="nav-logo block group"
              aria-label="go to homepage"
            >
              {/* Wordmark - visible on larger screens */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="120" 
                height="35" 
                viewBox="0 0 540 156" 
                fill="none" 
                className="nav-logo__wordmark-svg hidden sm:block transition-opacity duration-300 group-hover:opacity-70"
              >
                <path d="M78.1189 156C104.864 156 128.46 142.594 142.542 122.162C150.631 142.968 171.556 156 199.261 156C219.221 156 236.057 149.64 246.874 139.183L245.315 152.771H279.112L287.201 82.4124L305.982 152.771H339.811L358.592 82.4124L366.676 152.771H400.473L396.853 121.273C410.857 142.204 434.75 156 461.881 156C505.024 156 540 121.128 540 78.1118C540 35.096 505.014 0.223607 461.871 0.223607C428.397 0.223607 399.852 21.2219 388.733 50.7173L383.272 3.22411H345.923L322.886 89.5314L299.849 3.22411H262.5L257.253 48.8556C256.617 35.5796 251.151 23.5516 241.721 14.8413C231.212 5.13257 216.53 0 199.256 0C183.072 0 169.126 4.59695 158.924 13.2968C151.403 19.7139 146.48 27.9977 144.576 37.1864C130.812 15.0025 106.205 0.223607 78.1189 0.223607C34.9757 0.223607 0 35.096 0 78.1118C0 121.128 34.9757 156 78.1189 156ZM461.871 35.2728C485.602 35.2728 504.837 54.451 504.837 78.1118C504.837 101.773 485.602 120.951 461.871 120.951C438.14 120.951 418.905 101.773 418.905 78.1118C418.905 54.451 438.14 35.2728 461.871 35.2728ZM199.261 32.6467C213.927 32.6467 222.929 39.4173 223.336 50.7589L223.461 54.2066H256.643L253.222 83.9932C251.521 81.2631 249.503 78.741 247.151 76.4478C239.411 68.9179 228.062 63.7905 213.411 61.2112L193.66 57.6855C180.574 55.335 177.893 51.2581 177.893 45.8603C177.893 44.5083 178.493 32.6415 199.261 32.6415V32.6467ZM185.08 90.4258L208.352 94.7784C223.378 97.6541 225.402 103.733 225.402 109.302C225.402 118.096 215.383 123.556 199.251 123.556C180.094 123.556 172.855 112.781 172.474 103.556L172.333 100.129H153.046C155.106 93.1455 156.233 85.7613 156.233 78.1118C156.233 77.7478 156.212 77.3838 156.207 77.0198C163.143 83.5876 172.829 88.1689 185.075 90.4258H185.08ZM78.1189 35.2728C101.85 35.2728 121.085 54.451 121.085 78.1118C121.085 101.773 101.85 120.951 78.1189 120.951C54.388 120.951 35.153 101.773 35.153 78.1118C35.153 54.451 54.388 35.2728 78.1189 35.2728Z" fill="currentColor"/>
              </svg>
              
              {/* Icon - visible on mobile */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="32" 
                height="32" 
                viewBox="0 0 187 187" 
                fill="none" 
                className="nav-logo__icon-svg sm:hidden transition-opacity duration-300 group-hover:opacity-70"
              >
                <path d="M126.049 76.7471L167.276 35.5197L150.805 19.0486L109.577 60.276C107.82 62.0398 104.808 60.7915 104.808 58.3009V0H81.517V70.3375C81.517 76.511 76.511 81.517 70.3375 81.517H0V104.808H58.3009C60.7915 104.808 62.0398 107.82 60.276 109.577L19.0548 150.805L35.5259 167.276L76.7533 126.049C78.5109 124.291 81.5232 125.533 81.5232 128.024V186.324H104.814V115.987C104.814 109.813 109.82 104.808 115.993 104.808H186.331V81.517H128.03C125.539 81.517 124.291 78.5047 126.055 76.7471H126.049Z" fill="currentColor"/>
              </svg>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="nav-bar__buttons flex items-center gap-2 flex-shrink-0">
            {/* Login Button */}
            <div className="nav-bar__login-button hidden sm:block">
              {onLoginClick ? (
                <button
                  onClick={onLoginClick}
                  className="relative overflow-hidden px-5 py-2.5 rounded-full bg-[#e5e5e5] text-[#1a1a1a] text-sm font-medium transition-all duration-300 hover:bg-[#d5d5d5] group"
                >
                  <span className="relative z-10">{loginText}</span>
                </button>
              ) : (
                <Link
                  href={loginHref}
                  className="relative overflow-hidden px-5 py-2.5 rounded-full bg-[#e5e5e5] text-[#1a1a1a] text-sm font-medium transition-all duration-300 hover:bg-[#d5d5d5] group"
                >
                  <span className="relative z-10">{loginText}</span>
                </Link>
              )}
            </div>

            {/* Signup Button */}
            <div className="nav-bar__signup-button">
              {onSignupClick ? (
                <button
                  onClick={onSignupClick}
                  className="relative overflow-hidden px-5 py-2.5 rounded-md bg-[#803cee] text-white text-sm font-medium transition-all duration-300 hover:bg-[#6b2fd4] group"
                >
                  <span className="relative z-10">{signupText}</span>
                </button>
              ) : (
                <Link
                  href={signupHref}
                  className="relative overflow-hidden px-5 py-2.5 rounded-md bg-[#803cee] text-white text-sm font-medium transition-all duration-300 hover:bg-[#6b2fd4] group"
                >
                  <span className="relative z-10">{signupText}</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Bottom line separator */}
        <div className="nav-bar__line mt-4 h-px bg-[#1a1a1a]/10" />
      </div>
    </div>
  )
}

export default HeaderEnhanced
