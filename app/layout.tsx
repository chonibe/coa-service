import type React from "react"
import "./globals.css"
import { Fraunces, Barlow } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"
import { getProxiedImageUrl } from "@/lib/proxy-cdn-url"
import { SkipLink } from "@/components/accessibility/skip-link"
import { GoogleAnalytics } from "@/components/google-analytics"

const fraunces = Fraunces({ 
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

const barlow = Barlow({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
})

/** Logo icon (Group_707) used for favicon — same as street-collector/header */
const FAVICON_LOGO_URL = 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Group_707.png?v=1767356535'

export const metadata = {
  title: "Limited Edition Certificate System",
  description: "Manage and verify limited edition certificates",
  generator: 'v0.dev',
  icons: {
    icon: getProxiedImageUrl(FAVICON_LOGO_URL),
    apple: getProxiedImageUrl(FAVICON_LOGO_URL),
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          />
        )}
        {/* PostHog: inject key at runtime so it works even when client bundle was built before env was set. Skip placeholders. */}
        {process.env.NEXT_PUBLIC_POSTHOG_KEY?.startsWith("phc_") &&
          process.env.NEXT_PUBLIC_POSTHOG_KEY.length > 40 &&
          !process.env.NEXT_PUBLIC_POSTHOG_KEY.includes("your_project") && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__POSTHOG_KEY__=${JSON.stringify((process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "").trim())};window.__POSTHOG_HOST__=${JSON.stringify((process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").trim())};`,
            }}
          />
        )}
      </head>
      <body className={`${barlow.variable} ${fraunces.variable} font-sans min-h-screen bg-background text-foreground antialiased`} style={{ fontFamily: 'var(--font-barlow), system-ui, sans-serif' }} suppressHydrationWarning>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
            <SkipLink />
            <GoogleAnalytics />
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
