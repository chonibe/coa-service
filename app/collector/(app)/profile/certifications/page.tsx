'use client'

import { useEffect, useState, useMemo } from 'react'
import { ContentCard } from '@/components/app-shell'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, Clock, FileText, Scan, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Collector Certifications — Phase 1.6
//
// API: /api/collector/certifications
// Render: Certificate cards with artwork thumbnail, status badge, certificate link
// Tap certificate: Opens /certificate/[lineItemId]
// Tap "Authenticate": Opens /collector/artwork/[lineItemId] for NFC scan
// Old source: certifications-hub.tsx
// ============================================================================

interface Certification {
  id: number
  lineItemId: string
  name: string
  vendorName: string | null
  seriesName: string | null
  nfcTagId: string | null
  nfcClaimedAt: string | null
  certificateUrl: string | null
  certificateToken: string | null
  status: 'authenticated' | 'pending' | 'certificate_available' | 'no_nfc'
  imgUrl: string | null
  purchaseDate: string
  editionNumber: number | null
  editionTotal: number | null
}

type FilterBy = 'all' | 'authenticated' | 'pending' | 'certificate_available' | 'no_nfc'

function getStatusBadge(status: string) {
  switch (status) {
    case 'authenticated':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
          <ShieldCheck className="w-3 h-3" /> Authenticated
        </span>
      )
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
          <Clock className="w-3 h-3" /> Pending
        </span>
      )
    case 'certificate_available':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
          <FileText className="w-3 h-3" /> Certificate
        </span>
      )
    case 'no_nfc':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
          <Scan className="w-3 h-3" /> No NFC
        </span>
      )
    default:
      return null
  }
}

export default function CollectorCertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [filterBy, setFilterBy] = useState<FilterBy>('all')

  useEffect(() => {
    async function fetchCertifications() {
      try {
        const res = await fetch('/api/collector/certifications')
        const json = await res.json()
        if (json.success || json.certifications) {
          setCertifications(json.certifications || [])
        }
      } catch (err) {
        console.error('[Certifications] Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCertifications()
  }, [])

  const filtered = useMemo(() => {
    if (filterBy === 'all') return certifications
    return certifications.filter((c) => c.status === filterBy)
  }, [certifications, filterBy])

  const stats = useMemo(() => ({
    authenticated: certifications.filter((c) => c.status === 'authenticated').length,
    pending: certifications.filter((c) => c.status === 'pending').length,
    certificates: certifications.filter((c) => c.status === 'certificate_available').length,
  }), [certifications])

  const filters: { value: FilterBy; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'authenticated', label: 'Authenticated' },
    { value: 'pending', label: 'Pending' },
    { value: 'certificate_available', label: 'With Certificate' },
  ]

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-lg font-heading font-semibold text-gray-900">Certifications</h1>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <ContentCard padding="sm">
          <div className="text-center">
            <p className="text-lg font-bold text-green-600 font-body">{stats.authenticated}</p>
            <p className="text-[10px] text-gray-500 font-body uppercase tracking-wide">Verified</p>
          </div>
        </ContentCard>
        <ContentCard padding="sm">
          <div className="text-center">
            <p className="text-lg font-bold text-amber-600 font-body">{stats.pending}</p>
            <p className="text-[10px] text-gray-500 font-body uppercase tracking-wide">Pending</p>
          </div>
        </ContentCard>
        <ContentCard padding="sm">
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600 font-body">{stats.certificates}</p>
            <p className="text-[10px] text-gray-500 font-body uppercase tracking-wide">Certs</p>
          </div>
        </ContentCard>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterBy(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold font-body shrink-0 transition-all',
              filterBy === f.value
                ? 'bg-[#390000] text-[#ffba94]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ContentCard key={i} padding="md">
              <div className="flex items-center gap-4 animate-pulse">
                <div className="w-16 h-20 rounded-lg bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
              </div>
            </ContentCard>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-body">No certifications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((cert) => (
            <ContentCard key={cert.id} padding="md" hoverable>
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {cert.imgUrl ? (
                    <Image src={cert.imgUrl} alt={cert.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      No img
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 font-body truncate">{cert.name}</p>
                  {cert.vendorName && (
                    <p className="text-xs text-gray-500 font-body">{cert.vendorName}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {getStatusBadge(cert.status)}
                    {cert.editionNumber != null && (
                      <span className="text-[10px] font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{cert.editionNumber}{cert.editionTotal ? `/${cert.editionTotal}` : ''}
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-3">
                    {cert.certificateUrl && (
                      <Link
                        href={`/certificate/${cert.lineItemId}`}
                        className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold"
                      >
                        View Certificate
                      </Link>
                    )}
                    {cert.status === 'pending' && (
                      <Link
                        href={`/collector/artwork/${cert.lineItemId}`}
                        className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold"
                      >
                        Authenticate
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </ContentCard>
          ))}
        </div>
      )}
    </div>
  )
}
