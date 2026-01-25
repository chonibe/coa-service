import type React from "react"
import "./globals.css"
import { Fraunces, Barlow } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"
import { SkipLink } from "@/components/accessibility/skip-link"

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

export const metadata = {
  title: "Limited Edition Certificate System",
  description: "Manage and verify limited edition certificates",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        {/* Polaris Web Components - Load from CDN */}
        <script type="module" src="https://cdn.shopify.com/shopifycloud/app-bridge.js" async />
        <link rel="stylesheet" href="https://cdn.shopify.com/shopifycloud/polaris-web-components/polaris-web-components.css" />
      </head>
      <body className={`${barlow.variable} ${fraunces.variable} font-sans min-h-screen bg-background text-foreground antialiased`} style={{ fontFamily: 'var(--font-barlow), system-ui, sans-serif' }}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <SkipLink />
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
