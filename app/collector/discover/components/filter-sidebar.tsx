"use client"




import { Slider } from "@/components/ui/slider"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, Label, Button } from "@/components/ui"
interface FilterSidebarProps {
  availableArtists: string[]
  availableSeries: string[]
  minGlobalPrice: number
  maxGlobalPrice: number
}

export function FilterSidebar({
  availableArtists,
  availableSeries,
  minGlobalPrice,
  maxGlobalPrice,
}: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedArtists, setSelectedArtists] = useState<string[]>(searchParams.getAll("artist"))
  const [selectedSeries, setSelectedSeries] = useState<string[]>(searchParams.getAll("series"))
  const [priceRange, setPriceRange] = useState<[number, number]>([
    searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : minGlobalPrice,
    searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : maxGlobalPrice,
  ])

  useEffect(() => {
    setSelectedArtists(searchParams.getAll("artist"))
    setSelectedSeries(searchParams.getAll("series"))
    setPriceRange([
      searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : minGlobalPrice,
      searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : maxGlobalPrice,
    ])
  }, [searchParams, minGlobalPrice, maxGlobalPrice])

  const applyFilters = () => {
    const next = new URLSearchParams()
    selectedArtists.forEach((a) => next.append("artist", a))
    selectedSeries.forEach((s) => next.append("series", s))
    if (priceRange[0] !== minGlobalPrice) next.set("minPrice", priceRange[0].toString())
    if (priceRange[1] !== maxGlobalPrice) next.set("maxPrice", priceRange[1].toString())
    router.push(`/collector/discover?${next.toString()}`)
  }

  const clearFilters = () => {
    router.push("/collector/discover")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>Refine your search</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-2">Artist</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {availableArtists.map((artist) => (
              <div key={artist} className="flex items-center space-x-2">
                <Checkbox
                  id={`artist-${artist}`}
                  checked={selectedArtists.includes(artist)}
                  onCheckedChange={(checked) =>
                    setSelectedArtists((prev) => (checked ? [...prev, artist] : prev.filter((a) => a !== artist)))
                  }
                />
                <Label htmlFor={`artist-${artist}`}>{artist}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Series</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {availableSeries.map((series) => (
              <div key={series} className="flex items-center space-x-2">
                <Checkbox
                  id={`series-${series}`}
                  checked={selectedSeries.includes(series)}
                  onCheckedChange={(checked) =>
                    setSelectedSeries((prev) => (checked ? [...prev, series] : prev.filter((s) => s !== series)))
                  }
                />
                <Label htmlFor={`series-${series}`}>{series}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Price Range</h4>
          <Slider
            min={minGlobalPrice}
            max={maxGlobalPrice}
            step={1}
            value={priceRange}
            onValueChange={(v) => setPriceRange([v[0], v[1]])}
            className="w-full"
          />
          <div className="flex justify-between text-sm mt-2">
            <span>${priceRange[0].toFixed(2)}</span>
            <span>${priceRange[1].toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-between space-x-2">
          <Button variant="outline" onClick={clearFilters} className="flex-1">
            Clear
          </Button>
          <Button onClick={applyFilters} className="flex-1">
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


