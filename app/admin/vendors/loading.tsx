import { Loader2 } from "lucide-react"

export default function VendorsLoading() {
  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground mt-2">View all vendors from your Shopify products</p>
        </div>

        <div className="border rounded-md p-8 flex justify-center items-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading vendors...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
