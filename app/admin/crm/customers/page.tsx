"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Search, Mail, Instagram } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface Customer {
  id: string
  shopify_customer_id: number | null
  email: string | null
  first_name: string | null
  last_name: string | null
  instagram_username: string | null
  instagram_id: string | null
  chinadivision_order_ids: string[] | null
  shopify_order_ids: string[] | null
  total_orders: number | null
  total_spent: number | null
  first_order_date: string | null
  last_order_date: string | null
  notes: string | null
  created_at: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [total, setTotal] = useState(0)

  const fetchCustomers = async (search = "") => {
    try {
      setIsLoading(true)
      setError(null)
      
      const url = `/api/crm/customers?limit=50&offset=0${search ? `&search=${encodeURIComponent(search)}` : ""}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`)
      }

      const data = await response.json()
      setCustomers(data.customers || [])
      setTotal(data.total || 0)
      setIsLoading(false)
    } catch (err: any) {
      console.error("Error fetching customers:", err)
      setError(err.message || "Failed to load customers")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      setError(null)

      const response = await fetch("/api/shopify/sync-customers", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to sync customers")
      }

      const data = await response.json()
      
      // Refresh the customer list
      await fetchCustomers(searchQuery)
      
      alert(`Successfully synced ${data.customers_synced} customers (${data.created} created, ${data.updated} updated)`)
    } catch (err: any) {
      console.error("Error syncing customers:", err)
      setError(err.message || "Failed to sync customers")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSearch = () => {
    fetchCustomers(searchQuery)
  }

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Customers
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage and sync customers from ChinaDivision orders
            </p>
          </div>
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync from Orders
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Customers</CardTitle>
          <CardDescription>Search by email, name, or Instagram username</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Customer List {total > 0 && <Badge variant="secondary">{total}</Badge>}
          </CardTitle>
          <CardDescription>All synced customers from ChinaDivision orders</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No customers found. {!searchQuery && "Click 'Sync from Orders' to import customers from ChinaDivision orders."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Orders</th>
                    <th className="text-left p-2">Total Spent</th>
                    <th className="text-left p-2">Last Order</th>
                    <th className="text-left p-2">Instagram</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        {customer.first_name || customer.last_name
                          ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
                          : "N/A"}
                      </td>
                      <td className="p-2">
                        {customer.email ? (
                          <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                            {customer.email}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="p-2">
                        <Badge variant="secondary">
                          {customer.total_orders || 0} orders
                        </Badge>
                        {(customer.chinadivision_order_ids?.length || 0) > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({customer.chinadivision_order_ids?.length} CD)
                          </span>
                        )}
                        {(customer.shopify_order_ids?.length || 0) > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({customer.shopify_order_ids?.length} Shopify)
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        {customer.total_spent ? (
                          <span className="font-medium">
                            ${parseFloat(customer.total_spent.toString()).toFixed(2)}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {customer.last_order_date
                          ? new Date(customer.last_order_date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="p-2">
                        {customer.instagram_username ? (
                          <div className="flex items-center gap-1">
                            <Instagram className="h-4 w-4 text-pink-500" />
                            <span>{customer.instagram_username}</span>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

