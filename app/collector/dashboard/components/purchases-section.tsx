"use client"

import { useState, useMemo, useEffect } from "react"




import { Separator } from "@/components/ui"
import Image from "next/image"
import { ShieldCheck, Clock, FileText, ExternalLink, Scan, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { PremiumArtworkStack } from "./premium/PremiumArtworkStack"
import { PremiumExpandedStackModal } from "./premium/PremiumExpandedStackModal"
import type { CollectorLineItem } from "./artwork-grid"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
interface PurchasesSectionProps {
  items: CollectorLineItem[]
  purchasesByArtist?: Record<string, CollectorLineItem[]>
  purchasesBySeries?: Record<string, { series: any; items: CollectorLineItem[] }>
  groupingMode?: 'product' | 'artist'
  onGroupingModeChange?: (mode: 'product' | 'artist') => void
}

type GroupBy = "artist" | "series" | "date" | "auth" | "product"
type SortBy = "date" | "name" | "artist" | "price"

export function PurchasesSection({ items, purchasesByArtist, purchasesBySeries, groupingMode = 'product', onGroupingModeChange }: PurchasesSectionProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>(groupingMode === 'artist' ? 'artist' : "product")
  const [sortBy, setSortBy] = useState<SortBy>("date")
  
  // Sync with parent grouping mode
  useEffect(() => {
    if (groupingMode) {
      setGroupBy(groupingMode === 'artist' ? 'artist' : 'product')
    }
  }, [groupingMode])
  
  // Notify parent of changes
  useEffect(() => {
    if (onGroupingModeChange && (groupBy === 'artist' || groupBy === 'product')) {
      onGroupingModeChange(groupBy)
    }
  }, [groupBy, onGroupingModeChange])
  const [selectedArtist, setSelectedArtist] = useState<string>("all")
  const [selectedSeries, setSelectedSeries] = useState<string>("all")
  const [expandedGroup, setExpandedGroup] = useState<any[] | null>(null)

  const artists = useMemo(() => {
    const artistSet = new Set(items.map((item) => item.vendorName).filter(Boolean))
    return Array.from(artistSet).sort()
  }, [items])

  const series = useMemo(() => {
    const seriesSet = new Set(
      items
        .map((item) => item.series?.id)
        .filter(Boolean)
        .map((s) => s as string),
    )
    return Array.from(seriesSet)
  }, [items])

  const filteredAndSorted = useMemo(() => {
    let filtered = [...items]

    // Filter by artist
    if (selectedArtist !== "all") {
      filtered = filtered.filter((item) => item.vendorName === selectedArtist)
    }

    // Filter by series
    if (selectedSeries !== "all") {
      filtered = filtered.filter((item) => item.series?.id === selectedSeries)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          const dateA = (a as any).purchaseDate || (a as any).created_at || 0
          const dateB = (b as any).purchaseDate || (b as any).created_at || 0
          return new Date(dateB).getTime() - new Date(dateA).getTime()
        case "name":
          return a.name.localeCompare(b.name)
        case "artist":
          return (a.vendorName || "").localeCompare(b.vendorName || "")
        case "price":
          return (b.price || 0) - (a.price || 0)
        default:
          return 0
      }
    })
    
    return filtered
  }, [items, selectedArtist, selectedSeries, sortBy])

  const groupedStacks = useMemo(() => {
    const mode = (groupBy === 'artist' || groupBy === 'series') ? groupBy : 'product';
    
    if (groupBy === 'product' || groupBy === 'date' || groupBy === 'auth') {
       // Group by product for the "Stacked" view
       return Object.values(filteredAndSorted.reduce((acc, item) => {
         const key = item.productId || item.name
         if (!acc[key]) acc[key] = []
         acc[key].push(item)
         return acc
       }, {} as Record<string, CollectorLineItem[]>))
    }
    
    if (groupBy === 'artist') {
      return Object.values(filteredAndSorted.reduce((acc, item) => {
        const key = item.vendorName || "Unknown Artist"
        if (!acc[key]) acc[key] = []
        acc[key].push(item)
        return acc
      }, {} as Record<string, CollectorLineItem[]>))
    }

    if (groupBy === 'series') {
      return Object.values(filteredAndSorted.reduce((acc, item) => {
        const key = item.series?.name || "No Series"
        if (!acc[key]) acc[key] = []
        acc[key].push(item)
        return acc
      }, {} as Record<string, CollectorLineItem[]>))
    }

    return [filteredAndSorted]
  }, [filteredAndSorted, groupBy])

  if (!items.length) {
    return (
      <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden p-12 text-center">
        <Award className="h-12 w-12 text-slate-200 mx-auto mb-4" />
        <CardTitle>No purchases yet</CardTitle>
        <CardDescription>When you purchase art, it will appear here.</CardDescription>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4 px-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Group by:</label>
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
            <SelectTrigger className="w-[140px] rounded-full h-9 text-xs font-bold border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="artist">Artist</SelectItem>
              <SelectItem value="series">Series</SelectItem>
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
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="artist">Artist</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <motion.div 
        key={groupBy}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12"
      >
        {groupedStacks.map((group: any, idx) => (
          <PremiumArtworkStack 
            key={(group[0].productId || group[0].name || idx) + groupBy} 
            group={group} 
            groupingMode={groupBy === 'artist' ? 'artist' : 'product'} 
            onExpand={setExpandedGroup}
          />
        ))}
      </motion.div>

      <PremiumExpandedStackModal 
        isOpen={!!expandedGroup}
        onClose={() => setExpandedGroup(null)}
        group={expandedGroup}
        groupingMode={groupBy === 'artist' ? 'artist' : 'product'}
      />
    </div>
  )
}

