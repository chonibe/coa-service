import { redirect } from 'next/navigation'

export default function CollectorIndexPage() {
  const appShellEnabled = process.env.NEXT_PUBLIC_APP_SHELL_ENABLED !== 'false'
  redirect(appShellEnabled ? '/collector/home' : '/collector/dashboard')
}
