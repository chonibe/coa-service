import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type SortBy = "newest" | "price_asc" | "price_desc" | "artist"

interface MarketplaceFilters {
  artist?: string
  series?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: SortBy
  limit?: number
  offset?: number
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = request.nextUrl

  const filters: MarketplaceFilters = {
    artist: searchParams.get("artist") || undefined,
    series: searchParams.get("series") || undefined,
    minPrice: searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined,
    maxPrice: searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined,
    sortBy: (searchParams.get("sortBy") as SortBy) || "newest",
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 24,
    offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0,
  }

  try {
    let query = supabase
      .from("vendor_product_submissions")
      .select(
        `
        id,
        product_data,
        series_id,
        submitted_at,
        vendors!inner (
          vendor_name,
          bio,
          profile_image_url
        ),
        artwork_series_members (
          display_order,
          is_locked,
          artwork_series (
            id,
            name,
            unlock_type,
            thumbnail_url,
            description
          )
        )
      `,
      )
      .eq("status", "published")

    if (filters.artist) {
      query = query.eq("vendors.vendor_name", filters.artist)
    }
    if (filters.series) {
      query = query.eq("artwork_series_members.artwork_series.name", filters.series)
    }

    switch (filters.sortBy) {
      case "artist":
        query = query.order("vendors.vendor_name", { ascending: true })
        break
      default:
        query = query.order("submitted_at", { ascending: false })
        break
    }

    query = query.range(filters.offset!, filters.offset! + filters.limit! - 1)

    const { data, error } = await query
    if (error) {
      console.error("marketplace query error", error)
      return NextResponse.json({ success: false, message: "Failed to fetch marketplace" }, { status: 500 })
    }

    const transformed =
      data
        ?.map((artwork) => {
          const productData = artwork.product_data as any
          const seriesMember = artwork.artwork_series_members?.[0]
          const series = seriesMember?.artwork_series
          const variants = productData?.variants || []
          const price = variants.length > 0 ? parseFloat(variants[0].price) : null

          if (filters.minPrice && price && price < filters.minPrice) return null
          if (filters.maxPrice && price && price > filters.maxPrice) return null

          return {
            id: artwork.id,
            handle: productData?.handle,
            title: productData?.title || "Untitled",
            description: productData?.description || "",
            price,
            currency: "USD",
            images: productData?.images || [],
            vendor: {
              name: artwork.vendors?.vendor_name || "Unknown Artist",
              bio: artwork.vendors?.bio,
              profileImageUrl: artwork.vendors?.profile_image_url,
            },
            series: series
              ? {
                  id: series.id,
                  name: series.name,
                  unlockType: series.unlock_type,
                  thumbnailUrl: series.thumbnail_url,
                  description: series.description,
                }
              : null,
            seriesMember: seriesMember
              ? {
                  displayOrder: seriesMember.display_order,
                  isLocked: seriesMember.is_locked,
                }
              : null,
            shopifyProductId: productData?.id,
            submittedAt: artwork.submitted_at,
            isNew: false,
          }
        })
        .filter(Boolean) || []

    const { count } = await supabase
      .from("vendor_product_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")

    // available filters
    const { data: allPublished } = await supabase
      .from("vendor_product_submissions")
      .select(
        `
        product_data,
        vendors!inner(vendor_name),
        artwork_series_members!left(artwork_series(name))
      `,
      )
      .eq("status", "published")

    const artistSet = new Set<string>()
    const seriesSet = new Set<string>()
    let minPrice = Infinity
    let maxPrice = -Infinity
    allPublished?.forEach((a) => {
      if (a.vendors?.vendor_name) artistSet.add(a.vendors.vendor_name)
      a.artwork_series_members?.forEach((m: any) => {
        if (m.artwork_series?.name) seriesSet.add(m.artwork_series.name)
      })
      const variants = (a.product_data as any)?.variants || []
      if (variants.length > 0) {
        const p = parseFloat(variants[0].price)
        if (!Number.isNaN(p)) {
          minPrice = Math.min(minPrice, p)
          maxPrice = Math.max(maxPrice, p)
        }
      }
    })

    return NextResponse.json({
      success: true,
      artworks: transformed,
      pagination: { total: count || 0, limit: filters.limit, offset: filters.offset },
      filters,
      availableFilters: {
        artists: Array.from(artistSet).sort(),
        series: Array.from(seriesSet).sort(),
        minPrice: minPrice === Infinity ? 0 : Math.floor(minPrice),
        maxPrice: maxPrice === -Infinity ? 0 : Math.ceil(maxPrice),
      },
    })
  } catch (err: any) {
    console.error("marketplace api error", err)
    return NextResponse.json({ success: false, message: err.message || "Failed to fetch marketplace" }, { status: 500 })
  }
}


