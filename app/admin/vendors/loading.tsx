import { Loader2 } from "lucide-react"

export default function VendorsLoading() {
  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
            <p className="text-muted-foreground mt-2">View and manage all vendors from Shopify</p>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-muted rounded-md animate-pulse"></div>
            <div className="h-10 w-32 bg-muted rounded-md animate-pulse"></div>
          </div>
        </div>

        <div className="border rounded-lg shadow-sm">
          <div className="p-6 flex flex-col space-y-6">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted rounded-md animate-pulse"></div>
              <div className="h-4 w-64 bg-muted rounded-md animate-pulse"></div>
            </div>

            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <div className="flex-1">
                <div className="h-10 bg-muted rounded-md animate-pulse"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-10 w-[180px] bg-muted rounded-md animate-pulse"></div>
                <div className="h-10 w-24 bg-muted rounded-md animate-pulse"></div>
              </div>
            </div>

            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
