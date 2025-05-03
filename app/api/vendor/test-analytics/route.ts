import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return mock data for testing
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()

    // Generate last 6 months of data
    const salesByDate = Array.from({ length: 6 })
      .map((_, i) => {
        const month = (currentMonth - i + 12) % 12
        const year = currentMonth - i < 0 ? currentYear - 1 : currentYear
        const date = `${year}-${String(month + 1).padStart(2, "0")}`

        return {
          date,
          month: new Date(year, month, 1).toLocaleString("default", { month: "short", year: "numeric" }),
          sales: Math.floor(Math.random() * 10) + 1,
          revenue: Number((Math.random() * 500 + 100).toFixed(2)),
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    // Generate product data
    const productNames = ["Limited Edition Print", "Canvas Art", "Framed Photograph", "Art Book", "Digital Download"]

    const salesByProduct = productNames
      .map((title, i) => ({
        productId: `product-${i + 1}`,
        title,
        sales: Math.floor(Math.random() * 15) + 1,
        revenue: Number((Math.random() * 800 + 200).toFixed(2)),
      }))
      .sort((a, b) => b.sales - a.sales)

    // Generate sales history
    const salesHistory = Array.from({ length: 20 })
      .map((_, i) => {
        const daysAgo = Math.floor(Math.random() * 180)
        const date = new Date()
        date.setDate(date.getDate() - daysAgo)

        const productIndex = Math.floor(Math.random() * productNames.length)

        return {
          id: `mock-item-${i + 1}`,
          product_id: `product-${productIndex + 1}`,
          title: productNames[productIndex],
          date: date.toISOString(),
          price: Number((Math.random() * 150 + 50).toFixed(2)),
          currency: "GBP",
          quantity: 1,
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      salesByDate,
      salesByProduct,
      salesHistory,
      totalItems: salesHistory.length,
      isMockData: true,
      status: "success",
    })
  } catch (error: any) {
    console.error("Error in test analytics API:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred", status: "error" },
      { status: 500 },
    )
  }
}
