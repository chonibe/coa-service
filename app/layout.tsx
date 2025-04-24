import '@mantine/core/styles.layer.css'
import '@mantine/notifications/styles.layer.css'
import '@mantine/dates/styles.layer.css'
import '@mantine/modals/styles.layer.css'
import '@mantine/carousel/styles.layer.css'
import '@mantine/code-highlight/styles.layer.css'
import '@mantine/dropzone/styles.layer.css'
import '@mantine/form/styles.layer.css'
import '@mantine/spotlight/styles.layer.css'
import '@mantine/tiptap/styles.layer.css'
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
