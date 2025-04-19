import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
