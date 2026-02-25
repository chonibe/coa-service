import { redirect } from 'next/navigation'

export default function VendorIndexPage() {
  const appShellEnabled = process.env.NEXT_PUBLIC_APP_SHELL_ENABLED !== 'false'
  redirect(appShellEnabled ? '/vendor/home' : '/vendor/dashboard')
}
