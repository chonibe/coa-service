"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { TableCell, TableRow } from "@/components/ui/table"
import { Eye, AlertTriangle, Mail, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { formatUSD } from "@/lib/utils"
import { convertGBPToUSD } from "@/lib/utils"
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

  const convertPayoutAmount = (gbpAmount: number): number => {
    return convertGBPToUSD(gbpAmount)
  }

  const hasIssues = payout.amount < 0 || !payout.paypal_email

  return (
    <TableRow
      className={`${
        payout.amount < 0
          ? "bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500"
          : !payout.paypal_email
          ? "bg-amber-50 dark:bg-amber-950/20 border-l-4 border-l-amber-500"
          : ""
      } ${isSelected ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
    >
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(payout.vendor_name)}
          aria-label={`Select ${payout.vendor_name}`}
          disabled={!canSelect}
        />
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {payout.vendor_name}
          {payout.amount < 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Owing {formatUSD(Math.abs(convertPayoutAmount(payout.amount)))}
            </Badge>
          )}
          {!payout.paypal_email && (
            <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
              <Mail className="h-3 w-3 mr-1" />
              No Email
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        {payout.paypal_email ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span className="text-sm">{payout.paypal_email}</span>
          </div>
        ) : (
          <Badge variant="outline" className="text-red-500 border-red-200">
            <Mail className="h-3 w-3 mr-1" />
            Not set
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {payout.tax_id ? (
          <div className="text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>{payout.tax_id}</span>
            </div>
            <div className="text-muted-foreground ml-4">{payout.tax_country || "Unknown"}</div>
          </div>
        ) : (
          <Badge variant="outline" className="text-amber-500 border-amber-200">
            No tax info
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatUSD(convertPayoutAmount(payout.amount))}
      </TableCell>
      <TableCell>{payout.product_count}</TableCell>
      <TableCell>{formatDate(payout.last_payout_date)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(payout.vendor_name)}
            disabled={!canSelect}
          >
            {isSelected ? "Deselect" : "Select"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(payout.vendor_name)}
            title="View Line Items Details"
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            <span>Details</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

