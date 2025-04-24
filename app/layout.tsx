import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AppHeader } from "@/components/app-header"
import { ThemeProvider } from "@/components/theme-provider"
import { DesignSystem } from "@/components/design-system"
import { PageTransition } from "@/components/page-transition"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <DesignSystem>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AppHeader />
            <PageTransition>{children}</PageTransition>
          </ThemeProvider>
        </DesignSystem>
      </body>
    </html>
  )
}
