import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface LineItem {
  line_item_id: string
  order_id: string
  title: string
  quantity: number
  price: number
  image_url: string | null
  status: string
  created_at: string
}

interface CertificateModalProps {
  isOpen: boolean
  onClose: () => void
  lineItem: LineItem | null
}

export function CertificateModal({ isOpen, onClose, lineItem }: CertificateModalProps) {
  if (!lineItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Certificate of Authenticity</DialogTitle>
        </DialogHeader>
        
        <div className="mt-6 space-y-8">
          {/* Product Information */}
          <div className="flex gap-6">
            {lineItem.image_url && (
              <div className="w-48 h-48 flex-shrink-0">
                <img
                  src={lineItem.image_url}
                  alt={lineItem.title}
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                />
              </div>
            )}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{lineItem.title}</h3>
                <p className="text-sm text-gray-500">
                  Created on {format(new Date(lineItem.created_at), "MMMM d, yyyy")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Quantity</p>
                  <p className="text-lg">{lineItem.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Price</p>
                  <p className="text-lg">${lineItem.price}</p>
                </div>
              </div>
              <Badge variant={lineItem.status === 'active' ? 'default' : 'secondary'}>
                {lineItem.status}
              </Badge>
            </div>
          </div>

          {/* Certificate Content */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="text-lg font-semibold">Certificate of Authenticity</h4>
                  <p className="text-sm text-gray-500">This certifies that the above item is authentic</p>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600">
                    This certificate verifies the authenticity of the artwork and confirms its provenance.
                    The item has been verified and authenticated by our team of experts.
                  </p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm font-medium">Certificate ID</p>
                    <p className="text-sm text-gray-500">{lineItem.line_item_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Date Issued</p>
                    <p className="text-sm text-gray-500">{format(new Date(lineItem.created_at), "MMMM d, yyyy")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 