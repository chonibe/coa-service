import '@mantine/core/styles.css'
import './globals.css'

import { ColorSchemeScript } from '@mantine/core'
import { Providers } from "./providers"

export const metadata = {
  title: 'Certificate of Authenticity',
  description: 'Manage your certificates and verify their authenticity',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
