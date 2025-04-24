import type React from "react"
import type { Metadata } from "next"
import RootLayout from "./page"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <RootLayout children={children} />
}


import './globals.css'