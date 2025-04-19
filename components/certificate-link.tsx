import type React from "react"
import Link from "next/link"

export function CertificateLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Link href={`/certificate/${id}`} className="text-blue-600 hover:underline">
      {children}
    </Link>
  )
}
