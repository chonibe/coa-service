import type React from "react"
import "./globals.css"
import { Fraunces, Barlow } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"
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
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          />
        )}
      </head>
      <body className={`${barlow.variable} ${fraunces.variable} font-sans min-h-screen bg-background text-foreground antialiased`} style={{ fontFamily: 'var(--font-barlow), system-ui, sans-serif' }}>
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
