"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { ShieldCheck, Clock, FileText, Scan, Download, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import type { CollectorCertification } from "@/types/collector"

interface CertificationsHubProps {
  certifications: CollectorCertification[]
}

type FilterBy = "all" | "authenticated" | "pending" | "certificate_available" | "no_nfc"

export function CertificationsHub({ certifications }: CertificationsHubProps) {
  const [filterBy, setFilterBy] = useState<FilterBy>("all")
  const [selectedArtist, setSelectedArtist] = useState<string>("all")

  const artists = useMemo(() => {
    const artistSet = new Set(certifications.map((c) => c.vendorName).filter(Boolean))
    return Array.from(artistSet).sort()
  }, [certifications])

  const filtered = useMemo(() => {
    let filtered = [...certifications]

    if (filterBy !== "all") {
      filtered = filtered.filter((c) => c.status === filterBy)
    }

    if (selectedArtist !== "all") {
      filtered = filtered.filter((c) => c.vendorName === selectedArtist)
    }

    return filtered.sort((a, b) => {
      // Sort by status priority, then by date
      const statusOrder: Record<string, number> = {
        authenticated: 1,
        pending: 2,
        certificate_available: 3,
        no_nfc: 4,
      }
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff
      return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    })
  }, [certifications, filterBy, selectedArtist])

  const getStatusBadge = (cert: CollectorCertification) => {
    switch (cert.status) {
      case "authenticated":
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Authenticated
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending Authentication
          </Badge>
        )
      case "certificate_available":
        return (
          <Badge variant="secondary" className="bg-blue-600 hover:bg-blue-700">
            <FileText className="h-3 w-3 mr-1" />
            Certificate Available
          </Badge>
        )
      case "no_nfc":
        return (
          <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
            <Scan className="h-3 w-3 mr-1" />
            No NFC Tag
          </Badge>
        )
      default:
        return null
    }
  }

  const stats = useMemo(() => {
    return {
      authenticated: certifications.filter((c) => c.status === "authenticated").length,
      pending: certifications.filter((c) => c.status === "pending").length,
      certificateAvailable: certifications.filter((c) => c.status === "certificate_available").length,
      noNfc: certifications.filter((c) => c.status === "no_nfc").length,
    }
  }, [certifications])

  if (!certifications.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No certifications yet</CardTitle>
          <CardDescription>Certifications from your purchases will appear here.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Authenticated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.authenticated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.certificateAvailable}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">No NFC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.noNfc}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterBy)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="authenticated">Authenticated</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="certificate_available">Certificate Available</SelectItem>
              <SelectItem value="no_nfc">No NFC Tag</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Artist:</label>
          <Select value={selectedArtist} onValueChange={setSelectedArtist}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Artists</SelectItem>
              {artists.map((artist) => (
                <SelectItem key={artist} value={artist}>
                  {artist}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Certifications List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((cert) => (
          <Card key={cert.id} className="h-full flex flex-col">
            {cert.imgUrl && (
              <div className="relative w-full h-48">
                <Image
                  src={cert.imgUrl}
                  alt={cert.name}
                  fill
                  className="object-cover rounded-t-lg"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            )}
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base leading-tight line-clamp-2 flex-1">{cert.name}</CardTitle>
                {getStatusBadge(cert)}
              </div>
              {cert.seriesName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="capitalize">
                    {cert.seriesName}
                  </Badge>
                  <span>Series</span>
                </div>
              )}
              {cert.vendorName && (
                <CardDescription className="capitalize">{cert.vendorName}</CardDescription>
              )}
              {cert.editionNumber !== null && (
                <div className="text-sm">
                  <Badge variant="outline" className="font-mono">
                    Edition #{cert.editionNumber}
                    {cert.editionTotal ? ` of ${cert.editionTotal}` : ""}
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="text-xs text-muted-foreground">
                Purchased: {format(new Date(cert.purchaseDate), "MMM d, yyyy")}
              </div>
              {cert.nfcTagId && (
                <div className="text-xs text-muted-foreground">
                  NFC Tag: <code className="bg-muted px-1 rounded">{cert.nfcTagId.slice(0, 8)}...</code>
                </div>
              )}
              {cert.nfcClaimedAt && (
                <div className="text-xs text-green-600">
                  Authenticated: {format(new Date(cert.nfcClaimedAt), "MMM d, yyyy")}
                </div>
              )}
            </CardContent>
            <CardContent className="flex gap-2 pt-0">
              {cert.certificateUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(cert.certificateUrl!, "_blank")}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View
                </Button>
              )}
              {cert.status === "pending" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => (window.location.href = "/pages/authenticate")}
                  className="flex-1"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Authenticate
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


