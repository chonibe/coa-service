import type { ReactNode } from "react"
import { Inter } from "next/font/google"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}


import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
