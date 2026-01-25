"use client"

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface ArtistSignatureBlockProps {
  signatureUrl: string | null
}

export function ArtistSignatureBlock({ signatureUrl }: ArtistSignatureBlockProps) {
  if (!signatureUrl) return null

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Artist Signature</h2>
        <div className="relative h-32 bg-white dark:bg-gray-900 rounded-lg border flex items-center justify-center">
          <Image
            src={signatureUrl}
            alt="Artist signature"
            width={256}
            height={128}
            className="object-contain max-w-full max-h-full"
          />
        </div>
      </CardContent>
    </Card>
  )
}
