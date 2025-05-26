import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RedirectButton } from "./components/RedirectButton"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Welcome to The Street Lamp Dashboard</CardTitle>
          <CardDescription className="text-center">
            Access your certificates and manage your orders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              To access your dashboard, you need to be logged into your Shopify account.
            </p>
            <p className="text-muted-foreground">
              You will be automatically redirected to your dashboard when you log in.
            </p>
          </div>
          <div className="flex justify-center">
            <RedirectButton />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
