import type React from "react"
import { Provider } from "@/components/ui/provider"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
