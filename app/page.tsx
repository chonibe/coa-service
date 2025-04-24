"use client"

import OrderLookup from "@/order-lookup"

export default function Home() {
  return (
    <main className="min-h-screen py-8 bg-gray-900 text-white">
      <div className="container mx-auto">
        <OrderLookup />
      </div>
    </main>
  )
}
