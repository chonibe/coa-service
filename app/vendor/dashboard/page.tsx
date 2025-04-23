import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { VendorSalesChart } from "./components/vendor-sales-chart"
import { ProductTable } from "./components/product-table"

export default async function VendorDashboardPage() {
  const cookieStore = cookies()
  const vendorName = cookieStore.get("vendor_session")?.value

  if (!vendorName) {
    redirect("/vendor/login")
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Vendor Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <VendorSalesChart vendorName={vendorName} />
      </div>

      <div className="mb-6">
        <ProductTable vendorName={vendorName} />
      </div>
    </div>
  )
}
