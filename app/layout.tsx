import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"
import { SkipLink } from "@/components/accessibility/skip-link"

const inter = Inter({ subsets: ["latin"] })

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
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
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
