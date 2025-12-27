"use client"

import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, AlertCircle, Clock, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { PayoutOverview } from "./components/payout-overview"
import { RedemptionRequestsTab } from "./components/redemption-requests-tab"
import { PendingPayoutsTab } from "./components/pending-payouts-tab"
import { PayoutHistoryTab } from "./components/payout-history-tab"
import { VendorLineItemsDrawer } from "./components/vendor-line-items-drawer"
import { PayoutProcessDialog } from "./components/payout-process-dialog"
import { usePayoutData } from "./hooks/use-payout-data"
import { usePayoutFilters } from "./hooks/use-payout-filters"
import type { PendingPayout } from "./types"

export default function AdminPayoutsPage() {
  const {
    pendingPayouts,
    payoutHistory,
    redemptionRequests,
    isLoading,
    isLoadingRequests,
    error,
    pagination,
    setPagination,
    fetchPayoutData,
    fetchRedemptionRequests,
    refresh,
  } = usePayoutData()

  const { filters, updateFilter, clearFilters, filterPendingPayouts, filterPayoutHistory } =
    usePayoutFilters()

  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedPayoutsForProcessing, setSelectedPayoutsForProcessing] = useState<PendingPayout[]>([])
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false)
  const [selectedPayoutVendors, setSelectedPayoutVendors] = useState<string[]>([])
  const { toast } = useToast()

  const handleRedemptionAction = async (
    payoutId: number,
    action: "approve" | "reject",
    reason?: string
  ) => {
    try {
      const response = await fetch("/api/admin/payouts/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payoutId,
          action,
          reason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process request")
      }

      const data = await response.json()

      toast({
        title: action === "approve" ? "Request Approved" : "Request Rejected",
        description: data.message || `Payout request ${action}d successfully`,
      })

      await fetchRedemptionRequests()
      await fetchPayoutData()
    } catch (err: any) {
      console.error(`Error ${action}ing redemption request:`, err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || `Failed to ${action} request`,
      })
    }
  }

  const handleViewDetails = (vendorName: string) => {
    setSelectedVendor(vendorName)
    setIsDrawerOpen(true)
  }

  const handleProcessPayouts = (selectedPayouts: PendingPayout[]) => {
    setSelectedPayoutsForProcessing(selectedPayouts)
    setIsProcessDialogOpen(true)
  }

  const handleProcessSuccess = () => {
    fetchPayoutData()
    setSelectedPayoutsForProcessing([])
    setSelectedPayoutVendors([])
  }


  const handleCheckPayPalStatus = async (batchId: string, payoutId: number) => {
    try {
      const response = await fetch(
        `/api/vendors/payouts/check-status?batchId=${batchId}&payoutId=${payoutId}`,
        {
          method: "GET",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to check PayPal status")
      }

      const result = await response.json()
      
      toast({
        title: "Status Updated",
        description: `Payout status: ${result.status}`,
      })

      await fetchPayoutData()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to check PayPal status",
      })
    }
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
    fetchPayoutData(page)
  }

  const filteredPending = filterPendingPayouts(pendingPayouts)
  const filteredHistory = filterPayoutHistory(payoutHistory)

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Vendor Payouts
            </h1>
            <p className="text-muted-foreground mt-2">Manage and process payments to vendors</p>
          </div>
          <Button variant="outline" onClick={refresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Overview */}
        <PayoutOverview
          pendingPayouts={pendingPayouts}
          payoutHistory={payoutHistory}
          isLoading={isLoading}
        />

        {/* Main Content Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests" className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Redemption Requests
              {redemptionRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {redemptionRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Pending Payouts
              {filteredPending.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {filteredPending.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Payout History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <RedemptionRequestsTab
              requests={redemptionRequests}
              isLoading={isLoadingRequests}
              onRefresh={fetchRedemptionRequests}
              onAction={handleRedemptionAction}
            />
          </TabsContent>

          <TabsContent value="pending">
            <PendingPayoutsTab
              pendingPayouts={pendingPayouts}
              isLoading={isLoading}
              pagination={pagination}
              onPageChange={handlePageChange}
              filters={filters}
              onFilterChange={updateFilter}
              onClearFilters={clearFilters}
              onProcessPayouts={handleProcessPayouts}
              onViewDetails={handleViewDetails}
              selectedPayouts={selectedPayoutVendors}
              onSelectionChange={setSelectedPayoutVendors}
            />
          </TabsContent>

          <TabsContent value="history">
            <PayoutHistoryTab
              history={filteredHistory}
              isLoading={isLoading}
              filters={filters}
              onFilterChange={updateFilter}
              onClearFilters={clearFilters}
              onCheckPayPalStatus={handleCheckPayPalStatus}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Line Items Drawer */}
      <VendorLineItemsDrawer
        open={isDrawerOpen && !!selectedVendor}
        onOpenChange={(open) => {
          setIsDrawerOpen(open)
          if (!open) {
            setSelectedVendor(null)
          }
        }}
        vendorName={selectedVendor || ""}
        dateRange={filters.dateRange}
        includePaid={filters.includePaid || false}
        onItemMarkedPaid={fetchPayoutData}
      />

      {/* Process Payouts Dialog */}
      <PayoutProcessDialog
        open={isProcessDialogOpen}
        onOpenChange={(open) => {
          setIsProcessDialogOpen(open)
          if (!open) {
            setSelectedPayoutVendors([])
          }
        }}
        selectedPayouts={selectedPayoutsForProcessing}
        onSuccess={handleProcessSuccess}
      />
    </div>
  )
}
