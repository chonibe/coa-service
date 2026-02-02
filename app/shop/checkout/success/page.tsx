import { Suspense } from 'react'
import { CheckoutSuccessContent } from './checkout-success-content'
import {
  Container,
  SectionWrapper,
} from '@/components/impact'

/**
 * Checkout Success Page (Server Component)
 * 
 * Thank you page displayed after successful Stripe checkout.
 * Wraps the client component in Suspense as required by Next.js 15.
 */

// Loading fallback
function CheckoutSuccessLoading() {
  return (
    <main className="min-h-screen bg-white">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow">
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-[#2c4bce]/20 border-t-[#2c4bce] rounded-full mb-4"></div>
            <p className="text-[#1a1a1a]/60">Loading order details...</p>
          </div>
        </Container>
      </SectionWrapper>
    </main>
  )
}

// Main export - Server Component with Suspense boundary
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessLoading />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
