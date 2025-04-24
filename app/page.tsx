"use client"

import type React from "react"
import "./globals.css"
import { AppHeader } from "@/components/app-header"
import { ThemeProvider } from "@/components/theme-provider"
import { DesignSystem } from "@/components/design-system"
import { motion } from "framer-motion"

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.3, ease: "easeInOut" } },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <DesignSystem>
          <AppHeader />
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1">
              {children}
            </motion.div>
          </ThemeProvider>
        </DesignSystem>
      </body>
    </html>
  )
}
