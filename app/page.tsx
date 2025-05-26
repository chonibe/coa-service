import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 md:p-24">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Welcome to The Street Lamp
          </h1>
          <p className="text-xl text-muted-foreground">
            Your gateway to exclusive limited edition certificates and digital collectibles
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card>
            <CardHeader>
              <CardTitle>For Collectors</CardTitle>
              <CardDescription>
                Access and manage your certificates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/login">
                <Button className="w-full">
                  View My Collection
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>For Artists</CardTitle>
              <CardDescription>
                Manage your limited edition releases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/login">
                <Button variant="outline" className="w-full">
                  Artist Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
