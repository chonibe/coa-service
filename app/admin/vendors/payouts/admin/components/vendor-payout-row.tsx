"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { TableCell, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, AlertTriangle, Mail, CheckCircle2, Clock } from "lucide-react"
import { format } from "date-fns"
import { formatUSD } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { PendingPayout } from "../types"

interface VendorPayoutRowProps {
  payout: PendingPayout
  isSelected: boolean
  onSelect: (vendorName: string) => void
  onViewDetails: (vendorName: string) => void
  canSelect: boolean
}

export function VendorPayoutRow({
  payout,
  isSelected,
  onSelect,
  onViewDetails,
  canSelect,
}: VendorPayoutRowProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return <span className="text-muted-foreground text-sm">Never</span>
    try {
      return format(new Date(dateString), "dd MMM yyyy")
    } catch (e) {
      return "Invalid date"
    }
  }

  // payout.amount is already in USD from the API
  const formatPayoutAmount = (amount: number): string => {
    return formatUSD(amount)
  }

  const hasNegativeBalance = payout.amount < 0
  const missingEmail = !payout.paypal_email

  // Determine row styling based on priority: negative balance > missing email > selected > normal
  const rowClassName = cn(
    "transition-colors",
    hasNegativeBalance && "bg-red-50/50 dark:bg-red-950/20 border-l-4 border-l-red-500",
    !hasNegativeBalance && missingEmail && "bg-amber-50/50 dark:bg-amber-950/20 border-l-4 border-l-amber-500",
    !hasNegativeBalance && !missingEmail && isSelected && "bg-blue-50/50 dark:bg-blue-950/20"
  )

  // Truncate email for display
  const truncateEmail = (email: string, maxLength: number = 30) => {
    if (email.length <= maxLength) return email
    return email.substring(0, maxLength - 3) + "..."
  }

  return (
    <TableRow className={rowClassName}>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelect(payout.vendor_name)}
                  aria-label={`Select ${payout.vendor_name}`}
                  disabled={!canSelect}
                />
              </div>
            </TooltipTrigger>
            {!canSelect && (
              <TooltipContent>
                <p className="text-sm">
                  {hasNegativeBalance
                    ? "Cannot select: Vendor has negative balance (owes money)"
                    : missingEmail
                    ? "Cannot select: PayPal email is missing"
                    : "Cannot select this vendor"}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2 flex-wrap">
          <span>{payout.vendor_name}</span>
          {hasNegativeBalance && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="destructive" className="text-xs cursor-help">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Owing {formatUSD(Math.abs(payout.amount))}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    This vendor has a negative balance due to refunds. The amount owed will be deducted from their next payout.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {missingEmail && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 cursor-help">
                    <Mail className="h-3 w-3 mr-1" />
                    No Email
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    PayPal email address is missing. This vendor cannot receive payouts until an email is added.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      <TableCell>
        {payout.paypal_email ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span className="text-sm truncate max-w-[200px]" title={payout.paypal_email}>
                    {truncateEmail(payout.paypal_email)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{payout.paypal_email}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Badge variant="outline" className="text-red-500 border-red-200">
            <Mail className="h-3 w-3 mr-1" />
            Not set
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {payout.tax_id ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs cursor-help">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>{payout.tax_id}</span>
                  </div>
                  <div className="text-muted-foreground ml-4">{payout.tax_country || "Unknown"}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">
                  Tax ID: {payout.tax_id}
                  {payout.tax_country && <br />}
                  {payout.tax_country && `Country: ${payout.tax_country}`}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-amber-500 border-amber-200 cursor-help">
                  No tax info
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Tax information is missing. This may be required for compliance.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatPayoutAmount(payout.amount)}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{payout.product_count} ready</span>
          {payout.pending_fulfillment_count > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs border-amber-200 text-amber-600 bg-amber-50/50 cursor-help w-fit">
                    <Clock className="h-2.5 w-2.5 mr-1" />
                    {payout.pending_fulfillment_count} pending
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    {payout.pending_fulfillment_count} product{payout.pending_fulfillment_count !== 1 ? "s" : ""} awaiting fulfillment. These items are not included in the payout calculation.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      <TableCell>{formatDate(payout.last_payout_date)}</TableCell>
      <TableCell>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(payout.vendor_name)}
          className="flex items-center gap-1"
        >
          <Eye className="h-4 w-4" />
          <span>Details</span>
        </Button>
      </TableCell>
    </TableRow>
  )
}

