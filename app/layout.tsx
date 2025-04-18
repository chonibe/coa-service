import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Artwork Portal Experience",
  description: "A magical connection between artists and collectors",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes glow {
            0% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.3), 0 0 10px rgba(99, 102, 241, 0.1); }
            50% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.5), 0 0 30px rgba(99, 102, 241, 0.3); }
            100% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.3), 0 0 10px rgba(99, 102, 241, 0.1); }
          }
          .shadow-glow {
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.4), 0 0 30px rgba(99, 102, 241, 0.2);
          }
          .animate-glow {
            animation: glow 3s infinite;
          }
        `,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
