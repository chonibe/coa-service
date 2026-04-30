import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Street Lamp builder — onboarding | Street Collector',
  description: 'Pick your Street Collector preferences and start building your lamp.',
  alternates: {
    canonical: '/shop/experience-v2/onboarding',
  },
}

export default function ExperienceOnboardingShell({ children }: { children: React.ReactNode }) {
  return children
}
