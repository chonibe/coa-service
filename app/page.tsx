import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lock, Store } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Authentication Portal</CardTitle>
          <CardDescription className="text-center">Select your login type to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin">Admin Login</TabsTrigger>
              <TabsTrigger value="vendor">Artist Login</TabsTrigger>
            </TabsList>
            <TabsContent value="admin" className="mt-6 space-y-4">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Access the admin dashboard to manage products, certificates, and artist settings.
              </p>
              <Button asChild className="w-full">
                <Link href="/admin/login">Continue to Admin Login</Link>
              </Button>
            </TabsContent>
            <TabsContent value="vendor" className="mt-6 space-y-4">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Store className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Access the artist portal to view your sales, manage payouts, and update your profile.
              </p>
              <Button asChild className="w-full">
                <Link href="/vendor/login">Continue to Artist Portal</Link>
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground">Contact support if you need assistance with login.</p>
        </CardFooter>
      </Card>
    </main>
  )
}
