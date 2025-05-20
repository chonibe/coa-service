import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your application settings",
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 