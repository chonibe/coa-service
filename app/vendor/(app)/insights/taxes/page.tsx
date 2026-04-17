'use client'

import { useCallback, useEffect, useState } from 'react'
import { SubTabBar, type SubTab, ContentCard } from '@/components/app-shell'
import { cn } from '@/lib/utils'
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// ============================================================================
// Vendor Insights - Tax documents — Phase 4 MVP
//
// API:
//  - GET  /api/vendor/tax-documents         list uploaded docs
//  - POST /api/vendor/tax-documents         multipart upload (W-9 / W-8BEN)
//  - GET  /api/vendor/tax-documents/[id]/download  signed URL
//
// The 1099 column is a placeholder — admin-generated 1099s show up here
// once the admin side writes them into vendor_tax_documents with
// doc_type='other' and an admin status.
// ============================================================================

const insightsTabs: SubTab[] = [
  { id: 'overview', label: 'Sales', href: '/vendor/insights' },
  { id: 'payouts', label: 'Payouts', href: '/vendor/insights/payouts' },
  { id: 'collectors', label: 'Collectors', href: '/vendor/insights/collectors' },
  { id: 'taxes', label: 'Taxes', href: '/vendor/insights/taxes' },
]

interface TaxDocument {
  id: string
  doc_type: 'w9' | 'w8ben' | 'other'
  tax_year: number | null
  storage_bucket: string
  storage_path: string
  file_name: string | null
  mime_type: string | null
  status: 'submitted' | 'accepted' | 'rejected'
  admin_notes: string | null
  uploaded_at: string
  reviewed_at: string | null
}

const STATUS_META: Record<TaxDocument['status'], { label: string; tone: string; icon: React.ReactNode }> = {
  submitted: {
    label: 'Under review',
    tone: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: <Clock className="w-3 h-3" />,
  },
  accepted: {
    label: 'Accepted',
    tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  rejected: {
    label: 'Needs update',
    tone: 'bg-red-50 text-red-800 border-red-200',
    icon: <XCircle className="w-3 h-3" />,
  },
}

const DOC_TYPE_LABEL: Record<TaxDocument['doc_type'], string> = {
  w9: 'W-9',
  w8ben: 'W-8BEN',
  other: '1099 / Other',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function VendorTaxesPage() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<TaxDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [migrationPending, setMigrationPending] = useState(false)
  const [docType, setDocType] = useState<TaxDocument['doc_type']>('w9')
  const [taxYear, setTaxYear] = useState<string>(String(new Date().getFullYear()))
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/tax-documents', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setDocuments(Array.isArray(json.documents) ? json.documents : [])
      setMigrationPending(Boolean(json.migrationPending))
    } catch (err) {
      console.error('[VendorTaxes] fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  const handleUpload = async () => {
    if (!fileToUpload) {
      toast({
        title: 'Pick a PDF first',
        description: 'Choose the signed tax form from your computer.',
        variant: 'destructive',
      })
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', fileToUpload)
      form.append('doc_type', docType)
      if (taxYear) form.append('tax_year', taxYear)

      const res = await fetch('/api/vendor/tax-documents', {
        method: 'POST',
        credentials: 'include',
        body: form,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      toast({
        title: 'Uploaded',
        description: 'We\'ll email you once the admin has reviewed it.',
      })
      setFileToUpload(null)
      await fetchDocs()
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err.message || 'Please retry.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (doc: TaxDocument) => {
    try {
      const res = await fetch(`/api/vendor/tax-documents/${doc.id}/download`, {
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not open')
      window.open(json.url, '_blank', 'noopener,noreferrer')
    } catch (err: any) {
      toast({ title: 'Could not open', description: err.message, variant: 'destructive' })
    }
  }

  const latestW9 = documents.find((d) => d.doc_type === 'w9')
  const form1099s = documents.filter((d) => d.doc_type === 'other')

  return (
    <>
      <SubTabBar tabs={insightsTabs} activeId="taxes" />
      <div className="px-4 py-4 max-w-4xl mx-auto space-y-5">
        <div>
          <h1 className="font-heading text-xl font-semibold text-[#1a1a1a] tracking-[-0.01em]">
            Tax documents
          </h1>
          <p className="font-body text-xs text-[#1a1a1a]/60 mt-0.5 max-w-xl leading-relaxed">
            Upload your signed W-9 (US) or W-8BEN (international) to keep payouts flowing. We&apos;ll
            post 1099 forms here in January each year.
          </p>
        </div>

        {migrationPending && (
          <ContentCard padding="md">
            <div className="flex items-start gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                The tax documents table isn&apos;t provisioned yet. Uploads will start working
                as soon as the latest migration is applied.
              </span>
            </div>
          </ContentCard>
        )}

        {/* W-9 status card */}
        <ContentCard padding="md">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-body text-[11px] tracking-[0.2em] uppercase text-[#1a1a1a]/50">
                W-9 / W-8BEN on file
              </p>
              <div className="mt-1">
                {latestW9 ? (
                  <>
                    <p className="font-body text-sm text-[#1a1a1a] font-semibold">
                      {DOC_TYPE_LABEL[latestW9.doc_type]} · {latestW9.tax_year || '—'}
                    </p>
                    <p className="font-body text-xs text-[#1a1a1a]/60 mt-0.5">
                      Uploaded {formatDate(latestW9.uploaded_at)}
                    </p>
                  </>
                ) : (
                  <p className="font-body text-sm text-[#1a1a1a]/70">
                    No W-9 on file. Payouts will pause once you cross the IRS $600 threshold.
                  </p>
                )}
              </div>
            </div>
            {latestW9 && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold',
                  STATUS_META[latestW9.status].tone,
                )}
              >
                {STATUS_META[latestW9.status].icon}
                {STATUS_META[latestW9.status].label}
              </span>
            )}
          </div>
        </ContentCard>

        {/* Upload form */}
        <ContentCard padding="md">
          <div className="space-y-3">
            <p className="font-body text-[11px] tracking-[0.2em] uppercase text-[#1a1a1a]/50">
              Upload a new form
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block font-body text-[11px] font-bold text-[#1a1a1a]/70 mb-1">
                  Document type
                </span>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as TaxDocument['doc_type'])}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-body focus:border-impact-primary focus:outline-none"
                >
                  <option value="w9">W-9 (US taxpayer)</option>
                  <option value="w8ben">W-8BEN (international)</option>
                  <option value="other">Other (supporting doc)</option>
                </select>
              </label>
              <label className="block">
                <span className="block font-body text-[11px] font-bold text-[#1a1a1a]/70 mb-1">
                  Tax year
                </span>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={taxYear}
                  onChange={(e) => setTaxYear(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-body focus:border-impact-primary focus:outline-none"
                />
              </label>
            </div>
            <label className="flex items-center gap-3 rounded-md border border-dashed border-gray-300 px-3 py-3 cursor-pointer hover:border-[#1a1a1a]/40">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="font-body text-xs text-[#1a1a1a]/70 truncate">
                {fileToUpload ? fileToUpload.name : 'Click to pick a PDF (max 10MB)'}
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
              />
            </label>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="font-body text-[11px] text-[#1a1a1a]/50 max-w-md leading-relaxed">
                Forms are stored privately. Only you and our finance team can download them.
              </p>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || !fileToUpload}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-impact-primary text-white text-xs font-bold font-body disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </ContentCard>

        {/* History */}
        <ContentCard padding="md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-body text-[11px] tracking-[0.2em] uppercase text-[#1a1a1a]/50">
                History
              </p>
              <p className="font-body text-[11px] text-[#1a1a1a]/40">{documents.length} records</p>
            </div>
            {loading ? (
              <div className="py-4 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : documents.length === 0 ? (
              <p className="font-body text-xs text-[#1a1a1a]/60 py-4 text-center">
                Nothing uploaded yet.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="font-body text-sm text-[#1a1a1a] truncate">
                        {DOC_TYPE_LABEL[doc.doc_type]}
                        {doc.tax_year ? ` · ${doc.tax_year}` : ''}
                      </p>
                      <p className="font-body text-[11px] text-[#1a1a1a]/60 mt-0.5 truncate">
                        {doc.file_name || doc.storage_path}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold',
                          STATUS_META[doc.status].tone,
                        )}
                      >
                        {STATUS_META[doc.status].icon}
                        {STATUS_META[doc.status].label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                        title="Open file"
                        aria-label="Open file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ContentCard>

        {/* 1099 placeholder */}
        {form1099s.length === 0 && (
          <ContentCard padding="md">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-[#1a1a1a]/40 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-body text-sm text-[#1a1a1a] font-semibold">
                  1099s arrive by January 31
                </p>
                <p className="font-body text-xs text-[#1a1a1a]/60 leading-relaxed">
                  If you earned $600+ last year, we&apos;ll post your 1099-NEC here and email you
                  a copy. Nothing to do right now.
                </p>
              </div>
            </div>
          </ContentCard>
        )}
      </div>
    </>
  )
}
