import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { BadgeCheck } from "lucide-react"

interface CertificateCardProps {
  id: string
  productTitle: string
  vendor: string
  editionNumber: number
  editionTotal: number
  date: string
}

export function CertificateCard({ id, productTitle, vendor, editionNumber, editionTotal, date }: CertificateCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">{productTitle}</h3>
            <p className="text-sm text-gray-500">{vendor}</p>
          </div>
          <div className="flex items-center text-green-600">
            <BadgeCheck className="h-5 w-5 mr-1" />
            <span className="text-xs font-medium">Verified</span>
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-gray-500">Edition</p>
            <p className="font-medium">
              #{editionNumber} of {editionTotal}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Date</p>
            <p className="font-medium">{new Date(date).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-6 py-3">
        <Link href={`/certificate/${id}`} className="text-sm text-blue-600 hover:underline">
          View Certificate
        </Link>
      </CardFooter>
    </Card>
  )
}
