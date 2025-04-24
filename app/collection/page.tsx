"use client"
import { useRouter } from "next/navigation"
import OrderLookup from "@/order-lookup"

export default function CollectionPage() {
  const router = useRouter()

  // This page is just a wrapper for the OrderLookup component
  // which we've transformed into a collection view

  return (
    <div className="container mx-auto px-4 py-8">
      <OrderLookup />
    </div>
  )
}
