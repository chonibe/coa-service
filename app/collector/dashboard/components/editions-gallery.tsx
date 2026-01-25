"use client"

import { useState, useMemo } from "react"




import Image from "next/image"
import { CheckCircle2, FileText, ExternalLink, Award, ChevronRight, Calendar } from "lucide-react"
import { motion } from "framer-motion"
import { PremiumArtworkStack } from "./premium/PremiumArtworkStack"
import type { CollectorEdition } from "@/types/collector"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
interface EditionsGalleryProps {
  editions: CollectorEdition[]
  onExpandStack: (group: any[], mode: 'product' | 'artist') => void
}

type FilterBy = "all" | "limited" | "open"
type SortBy = "number" | "date" | "artist" | "series"

export function EditionsGallery({ editions, onExpandStack }: EditionsGalleryProps) {
  const [filterBy, setFilterBy] = useState<FilterBy>("all")
  const [sortBy, setSortBy] = useState<SortBy>("date")
  const [selectedArtist, setSelectedArtist] = useState<string>("all")
  const [viewMode, setViewMode] = useState<'product' | 'artist'>('product')

  const artists = useMemo(() => {
    const artistSet = new Set(editions.map((e) => e.vendorName).filter(Boolean))
    return Array.from(artistSet).sort()
  }, [editions])

  const filteredAndSorted = useMemo(() => {
    let filtered = [...editions]

    // Filter by edition type
    if (filterBy === "limited") {
      filtered = filtered.filter((e) => e.editionType === "limited")
    } else if (filterBy === "open") {
      filtered = filtered.filter((e) => e.editionType === "open")
    }

    // Filter by artist
    if (selectedArtist !== "all") {
      filtered = filtered.filter((e) => e.vendorName === selectedArtist)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "number":
          if (a.editionNumber === null && b.editionNumber === null) return 0
          if (a.editionNumber === null) return 1
          if (b.editionNumber === null) return -1
          return a.editionNumber - b.editionNumber
        case "date":
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
        case "artist":
          return (a.vendorName || "").localeCompare(b.vendorName || "")
        case "series":
          return (a.series?.name || "").localeCompare(b.series?.name || "")
        default:
          return 0
      }
    })

    return filtered
  }, [editions, filterBy, sortBy, selectedArtist])

  const groupedEditions = useMemo(() => {
    if (viewMode === 'product') {
      return Object.values(filteredAndSorted.reduce((acc: any, edition: any) => {
        const key = edition.productId || edition.name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(edition);
        return acc;
      }, {}));
    } else {
      return Object.values(filteredAndSorted.reduce((acc: any, edition: any) => {
        const key = edition.vendorName || 'Unknown Artist';
        if (!acc[key]) acc[key] = [];
        acc[key].push(edition);
        return acc;
      }, {}));
    }
  }, [filteredAndSorted, viewMode]);

  if (!editions.length) {
    return (
      <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden p-12 text-center">
        <Award className="h-12 w-12 text-slate-200 mx-auto mb-4" />
        <CardTitle>No editions yet</CardTitle>
        <CardDescription>Editions from your purchases will appear here.</CardDescription>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Artworks Gallery</h3>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
          <Button 
            variant={viewMode === 'product' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('product')}
            className={`rounded-lg px-4 h-8 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'product' ? 'bg-white text-primary shadow-sm border-slate-200' : 'text-slate-500'}`}
          >
            By Item
          </Button>
          <Button 
            variant={viewMode === 'artist' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('artist')}
            className={`rounded-lg px-4 h-8 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'artist' ? 'bg-white text-primary shadow-sm border-slate-200' : 'text-slate-500'}`}
          >
            By Artist
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 px-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter:</label>
          <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterBy)}>
            <SelectTrigger className="w-[140px] rounded-full h-9 text-xs font-bold border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Editions</SelectItem>
              <SelectItem value="limited">Limited</SelectItem>
              <SelectItem value="open">Open</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sort:</label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
            <SelectTrigger className="w-[140px] rounded-full h-9 text-xs font-bold border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="number">Edition #</SelectItem>
              <SelectItem value="artist">Artist</SelectItem>
              <SelectItem value="series">Series</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <motion.div 
        key={viewMode}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12"
      >
        {groupedEditions.map((group: any) => (
          <PremiumArtworkStack 
            key={(group[0].productId || group[0].name) + viewMode} 
            group={group} 
            groupingMode={viewMode} 
            onExpand={(expandedGroup) => onExpandStack(expandedGroup, viewMode)}
          />
        ))}
      </motion.div>
    </div>
  )
}



