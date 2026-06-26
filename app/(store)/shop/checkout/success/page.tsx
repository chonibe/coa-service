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
    <main className="min-h-screen bg-background">
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="narrow">
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-experience-highlight/20 border-t-experience-highlight rounded-full mb-4"></div>
            <p className="text-muted-foreground">Loading order details...</p>
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
