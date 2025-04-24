import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/modals/styles.css'
import './globals.css'

import { ColorSchemeScript } from '@mantine/core'
import { Providers } from "./providers"

export const metadata = {
  title: 'My App',
  description: 'My App Description',
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
