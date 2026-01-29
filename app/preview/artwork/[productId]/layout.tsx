import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Preview - The Street Collector",
  description: "Preview your artwork page as collectors will see it",
}

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Standalone layout - minimal wrapper, no dashboard UI
  // Children render directly without any navigation or sidebars
  return <>{children}</>
}
