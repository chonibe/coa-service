import { Skeleton } from "@/components/ui"


import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui"
export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <Skeleton className="h-8 w-64 mb-6" />

      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-10 w-full max-w-xs mb-1" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-50 p-3 rounded">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <Skeleton className="h-4 w-5/6 mb-4" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>
  )
}
