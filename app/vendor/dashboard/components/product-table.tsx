"use client"




import { useState } from "react"
import { ChevronDown, ChevronUp, ExternalLink, Package, FileText } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { EditionBadge } from "./edition-badge"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Button } from "@/components/ui"
interface Product {
  id: string
  title: string
  handle: string
  price: string
  status: string
  vendor: string
  image?: string
  totalSales?: number
  revenue?: number
  edition_size?: number | null
  sold_count?: number
}

interface ProductTableProps {
  products: Product[]
}

export function ProductTable({ products }: ProductTableProps) {
  const [sortField, setSortField] = useState<keyof Product>("title")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  const handleSort = (field: keyof Product) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedProducts = [...products].sort((a, b) => {
    const fieldA = a[sortField]
    const fieldB = b[sortField]

    if (typeof fieldA === "string" && typeof fieldB === "string") {
      return sortDirection === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
    }

    if (typeof fieldA === "number" && typeof fieldB === "number") {
      return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA
    }

    return 0
  })

  const totalPages = Math.ceil(products.length / itemsPerPage)
  const displayedProducts = sortedProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">Active</Badge>
      case "draft":
        return <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" variant="outline">Draft</Badge>
      case "archived":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30" variant="outline">Archived</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const SortHeader = ({ field, label }: { field: keyof Product; label: string }) => (
    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort(field)}>
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {sortField === field && (
          <span className="text-xs">
            {sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        )}
      </div>
    </TableHead>
  )

  return (
    <div>
      <div className="rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <SortHeader field="title" label="Product" />
              <SortHeader field="price" label="Price" />
              <TableHead>Edition</TableHead>
              <SortHeader field="status" label="Status" />
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  {product.image ? (
                    <div className="relative h-8 w-8 rounded overflow-hidden">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{product.title}</TableCell>
                <TableCell>${product.price}</TableCell>
                <TableCell>
                  {product.edition_size && product.edition_size > 0 ? (
                    <EditionBadge
                      soldCount={product.sold_count || 0}
                      editionSize={product.edition_size}
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(product.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/vendor/dashboard/products/${product.handle}`}>
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild
                      title="Edit Artwork Page"
                    >
                      <Link href={`/vendor/dashboard/artwork-pages/by-handle/${product.handle}`}>
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Edit Artwork Page</span>
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {displayedProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between py-3 px-3">
          <div className="text-xs text-muted-foreground">
            {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, products.length)} of {products.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
