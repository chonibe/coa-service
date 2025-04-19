import { VendorInstagramDashboard } from "@/components/vendor-instagram-dashboard"

export const metadata = {
  title: "Vendor Instagram Dashboard",
  description: "Manage Instagram URLs for all vendors",
}

export default function InstagramDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Vendor Instagram Dashboard</h1>
      <p className="mb-6 text-gray-600">
        Manage Instagram URLs for all vendors. These URLs will be used to display Instagram feeds on certificate pages.
      </p>
      <VendorInstagramDashboard />
    </div>
  )
}
