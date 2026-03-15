import type React from "react"
import "./globals.css"
import { Fraunces, Barlow } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"
import { getProxiedImageUrl } from "@/lib/proxy-cdn-url"
import { GoogleAnalytics } from "@/components/google-analytics"
import { MetaPixel } from "@/components/meta-pixel"
import { TikTokPixel } from "@/components/tiktok-pixel"
import { AsyncMaterialSymbolsFont } from "@/components/AsyncMaterialSymbolsFont"
import { streetCollectorContent } from "@/content/street-collector"

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

/** Logo icon used for favicon — same as street-collector/header */
const FAVICON_LOGO_URL = 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/logo_1.png?v=1773229683'

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
        {/* Preload LCP image for landing page (/) — improves FCP/LCP */}
        <link
          rel="preload"
          as="image"
          href={getProxiedImageUrl(streetCollectorContent.hero.image)}
          fetchPriority="high"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <AsyncMaterialSymbolsFont />
        {/* GA script loaded deferred by GoogleAnalytics component to reduce first-load impact */}
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
            <MetaPixel />
            <TikTokPixel />
            <GoogleAnalytics />
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
