import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function BackfillVendorNamesLoading() {
  return (
    <div className="container py-10">
      <Skeleton className="h-8 w-64 mb-6" />
      <Skeleton className="h-5 w-full max-w-2xl mb-6" />

      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-40" />
        </CardFooter>
      </Card>
    </div>
  )
}
