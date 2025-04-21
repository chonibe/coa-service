"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

interface Profile {
  vendor_id: string
  account_id: string
  username: string
  profile_picture_url: string
  biography: string
  followers_count: number
  follows_count: number
  media_count: number
  created_at: string
  updated_at: string
}

const InstagramProfilesPage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfiles = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch vendors from Shopify
      const shopifyResponse = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2023-10/vendors.json`, {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      })

      if (!shopifyResponse.ok) {
        throw new Error(`Failed to fetch vendors from Shopify: ${shopifyResponse.status} ${shopifyResponse.statusText}`)
      }

      const shopifyData = await shopifyResponse.json()
      const shopifyVendors = shopifyData.vendors || []

      // Transform Shopify vendors to match the Profile interface
      const transformedProfiles = shopifyVendors.map((vendor: any) => ({
        vendor_id: vendor.name,
        account_id: "", // You'll need to add a field to store the Instagram account ID
        username: "", // You'll need to add a field to store the Instagram username
        profile_picture_url: "", // You'll need to add a field to store the Instagram profile picture URL
        biography: "", // You'll need to add a field to store the Instagram biography
        followers_count: 0, // You'll need to add a field to store the Instagram followers count
        follows_count: 0, // You'll need to add a field to store the Instagram follows count
        media_count: 0, // You'll need to add a field to store the Instagram media count
        created_at: new Date().toISOString(), // You'll need to add a field to store the creation date
        updated_at: new Date().toISOString(), // You'll need to add a field to store the update date
      }))

      setProfiles(transformedProfiles)
    } catch (error) {
      console.error("Could not fetch profiles:", error)
      setError("Could not fetch profiles. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  // Apply search filter with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfiles()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to ascending
      setSortField(field)
      setSortDirection("asc")
    }
    fetchProfiles()
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-5">Instagram Profiles</h1>
      <div className="mb-5 flex items-center space-x-4">
        <Input
          type="text"
          placeholder="Search by username or full name..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">
                <Button variant="ghost" onClick={() => handleSort("username")}>
                  Vendor
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("fullName")}>
                  Instagram URL
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("followers")}>
                  Followers
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("following")}>
                  Following
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.vendor_id}>
                <TableCell className="font-medium">{profile.vendor_id}</TableCell>
                <TableCell>{profile.biography}</TableCell>
                <TableCell>{profile.followers_count}</TableCell>
                <TableCell>{profile.follows_count}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default InstagramProfilesPage
