"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PurchaseDialog } from "./purchase-dialog"
import { useToast } from "@/components/ui/use-toast"

interface Artwork {
  id: string
  title: string
  imageUrl: string | null
  status: string
  submittedAt: string
  proofPrintsOrdered: number
  canOrderProofPrint: boolean
  remainingProofPrints: number
}

interface ArtworkCardProps {
  artwork: Artwork
  onPurchaseSuccess?: () => void
}

export function ArtworkCard({ artwork, onPurchaseSuccess }: ArtworkCardProps) {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const { toast } = useToast()

  const PROOF_PRINT_PRICE = 8.00

  const handlePurchaseClick = () => {
    if (!artwork.canOrderProofPrint) {
      toast({
        title: "Limit Reached",
        description: "You've already ordered the maximum of 2 proof prints for this artwork",
        variant: "destructive",
      })
      return
    }
    setShowPurchaseDialog(true)
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="relative h-48 w-full bg-muted">
          {artwork.imageUrl ? (
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2 flex-1">{artwork.title}</CardTitle>
            <Badge 
              variant={
                artwork.status === "published" ? "default" :
                artwork.status === "approved" ? "default" :
                artwork.status === "pending" ? "secondary" :
                "outline"
              }
              className="shrink-0"
            >
              {artwork.status === "pending" ? "Pending Approval" : 
               artwork.status === "approved" ? "Approved" :
               artwork.status === "published" ? "Published" :
               artwork.status}
            </Badge>
          </div>
          <CardDescription>
            {artwork.status === "pending" ? (
              <span className="text-amber-600 dark:text-amber-400">
                Awaiting approval • Proof prints available
              </span>
            ) : (
              `Proof prints ordered: ${artwork.proofPrintsOrdered} / 2`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price per print</span>
              <span className="font-semibold">${PROOF_PRINT_PRICE.toFixed(2)}</span>
            </div>
            {artwork.remainingProofPrints > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Remaining</span>
                <span className="text-sm font-medium">
                  {artwork.remainingProofPrints} {artwork.remainingProofPrints === 1 ? "print" : "prints"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handlePurchaseClick}
            className="w-full"
            disabled={!artwork.canOrderProofPrint}
          >
            {artwork.canOrderProofPrint
              ? `Order Proof Print ($${PROOF_PRINT_PRICE.toFixed(2)})`
              : "Maximum Reached"}
          </Button>
        </CardFooter>
      </Card>

      {showPurchaseDialog && (
        <PurchaseDialog
          open={showPurchaseDialog}
          onOpenChange={setShowPurchaseDialog}
          purchaseType="proof_print"
          artworkSubmissionId={artwork.id}
          artworkTitle={artwork.title}
          price={PROOF_PRINT_PRICE}
          onSuccess={() => {
            setShowPurchaseDialog(false)
            if (onPurchaseSuccess) {
              onPurchaseSuccess()
            }
          }}
        />
      )}
    </>
  )
}

