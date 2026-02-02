import { 
  ScrollingAnnouncementBar, 
  defaultAnnouncementMessages,
  Header,
  Footer 
} from '@/components/impact'

/**
 * Shop Layout
 * 
 * Wraps all shop pages with:
 * - Scrolling announcement bar at the top
 * - Site header with navigation
 * - Page content
 * - Site footer with newsletter and links
 */

// Navigation items for the header
const shopNavigation = [
  { label: 'Shop', href: '/shop' },
  { label: 'Artists', href: '/shop/artists' },
  { label: 'About', href: '/about' },
]

// Footer sections
const footerSections = [
  {
    title: 'Street Collector',
    links: [
      { label: 'Search', href: '/search' },
      { label: 'Artist Submissions', href: '/artist-submissions' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Terms of Service', href: '/policies/terms-of-service' },
      { label: 'Shipping Policy', href: '/policies/shipping-policy' },
      { label: 'Refund Policy', href: '/policies/refund-policy' },
      { label: 'Privacy Policy', href: '/policies/privacy-policy' },
      { label: 'Contact', href: '/contact' },
    ],
  },
]

// Social links
const socialLinks: Array<{ platform: 'facebook' | 'instagram'; href: string }> = [
  { platform: 'facebook', href: 'https://facebook.com/streetcollector' },
  { platform: 'instagram', href: 'https://instagram.com/thestreetcollector' },
]

// Legal links for footer bottom
const legalLinks = [
  { label: 'Refund policy', href: '/policies/refund-policy' },
  { label: 'Privacy policy', href: '/policies/privacy-policy' },
  { label: 'Terms of service', href: '/policies/terms-of-service' },
  { label: 'Shipping policy', href: '/policies/shipping-policy' },
  { label: 'Contact information', href: '/contact' },
]

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Scrolling Announcement Bar */}
      <ScrollingAnnouncementBar 
        messages={defaultAnnouncementMessages}
        speed={25}
      />
      
      {/* Header */}
      <Header 
        navigation={shopNavigation}
        logoHref="/shop"
      />
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <Footer
        sections={footerSections}
        socialLinks={socialLinks}
        newsletterEnabled={true}
        newsletterTitle="Sign up for new stories and personal offers"
        newsletterDescription=""
        tagline="In a world where art is often consumed on screens, The Street Lamp bridges the gap between the digital and the real, bringing art back into the physical world to be truly felt and experienced."
        legalLinks={legalLinks}
      />
    </div>
  )
}
