import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { MobileNav } from "@/components/mobile-nav"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex flex-col min-h-screen">
            <header className="px-4 lg:px-6 h-16 flex items-center border-b">
              <a className="flex items-center justify-center" href="/">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 mr-2"
                >
                  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                  <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                  <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                  <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                </svg>
                <span className="font-bold">Art Certificates</span>
              </a>
              <nav className="ml-auto flex gap-4 sm:gap-6">
                <a className="text-sm font-medium hover:underline underline-offset-4" href="/admin">
                  Admin
                </a>
                <a className="text-sm font-medium hover:underline underline-offset-4 font-bold" href="/collection">
                  My Collection
                </a>
                <a className="text-sm font-medium hover:underline underline-offset-4" href="/vendor/login">
                  Vendor Login
                </a>
              </nav>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6 px-4 md:px-6">
              <div className="container mx-auto">
                <p className="text-xs text-gray-500">© 2024 Art Certificates. All rights reserved.</p>
              </div>
            </footer>
            <MobileNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
