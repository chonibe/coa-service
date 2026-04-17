'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Upload, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import { ContentCard } from '@/components/app-shell'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// ============================================================================
// Vendor Studio — Bulk artwork upload (Phase 2.8)
//
// API: POST /api/vendor/products/bulk
// Inputs: CSV paste or file upload. Columns:
//   title, description, edition_size, price, sku, product_type, tags
//   (tags is pipe-separated)
// Every row lands as a DRAFT submission. Artists finish each draft by
// adding imagery + production files in the existing wizard.
// ============================================================================

interface ParsedRow {
  title: string
  description?: string
  edition_size?: string
  price: string
  sku?: string
  product_type?: string
  tags: string[]
  _rowIndex: number
  _error?: string
}

const REQUIRED_HEADERS = ['title', 'price'] as const
const OPTIONAL_HEADERS = ['description', 'edition_size', 'price', 'sku', 'product_type', 'tags'] as const

const SAMPLE_CSV = `title,description,edition_size,price,sku,product_type,tags
Dawn Over Kyoto,Giclee print hand-signed by the artist.,100,85.00,DAWN-KYT-01,Art Prints,urban|asia
Harbor Light,"A quiet meditation on the sea, printed on Hahnemühle.",50,120.00,HARB-LGT-01,Art Prints,nautical|landscape
Sun Glow,Risograph print in 3-colour.,200,45.00,,Risograph Prints,abstract|risograph
`

// Parse a single CSV line, respecting simple quoted values. Enough for
// the well-behaved CSVs we export. We're not trying to be RFC-4180 here.
function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  out.push(current)
  return out.map((s) => s.trim())
}

function parseCsv(text: string): { rows: ParsedRow[]; headerError?: string } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return { rows: [] }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
  if (missing.length > 0) {
    return { rows: [], headerError: `Missing required columns: ${missing.join(', ')}` }
  }

  const idx = (name: string) => headers.indexOf(name)
  const iTitle = idx('title')
  const iDesc = idx('description')
  const iEdition = idx('edition_size')
  const iPrice = idx('price')
  const iSku = idx('sku')
  const iType = idx('product_type')
  const iTags = idx('tags')

  const rows: ParsedRow[] = []
  for (let r = 1; r < lines.length; r += 1) {
    const parts = parseCsvLine(lines[r])
    const title = (parts[iTitle] || '').trim()
    const price = (parts[iPrice] || '').trim()
    const row: ParsedRow = {
      _rowIndex: r,
      title,
      description: iDesc >= 0 ? parts[iDesc]?.trim() : '',
      edition_size: iEdition >= 0 ? parts[iEdition]?.trim() : '',
      price,
      sku: iSku >= 0 ? parts[iSku]?.trim() : '',
      product_type: iType >= 0 ? parts[iType]?.trim() : '',
      tags:
        iTags >= 0 && parts[iTags]
          ? parts[iTags]
              .split('|')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
    }

    if (!title) row._error = 'Title is required'
    // eslint-disable-next-line security/detect-unsafe-regex -- bounded linear pattern, no catastrophic backtracking
    else if (!price || !/^[0-9]+(?:\.[0-9]{1,2})?$/.test(price)) row._error = 'Price must be e.g. 45 or 45.00'
    else if (
      row.edition_size &&
      !/^\d+$/.test(row.edition_size)
    )
      row._error = 'Edition size must be a positive integer'

    rows.push(row)
  }

  return { rows }
}

export default function BulkUploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [csvText, setCsvText] = useState('')
  const [headerError, setHeaderError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const parsed = useMemo(() => {
    if (!csvText.trim()) {
      setHeaderError(null)
      return { rows: [] as ParsedRow[] }
    }
    const out = parseCsv(csvText)
    setHeaderError(out.headerError || null)
    return out
  }, [csvText])

  const validRows = parsed.rows.filter((r) => !r._error)
  const invalidRows = parsed.rows.filter((r) => r._error)

  const handleFile = async (file: File) => {
    try {
      const text = await file.text()
      setCsvText(text)
    } catch (err) {
      toast({
        title: 'Could not read file',
        description: 'Try pasting the CSV directly instead.',
        variant: 'destructive',
      })
    }
  }

  const loadSample = () => setCsvText(SAMPLE_CSV.trim())

  const submit = async () => {
    if (validRows.length === 0) return
    if (validRows.length > 25) {
      toast({
        title: 'Too many rows',
        description: 'Bulk uploads are limited to 25 artworks per batch. Split the CSV into smaller files.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/vendor/products/bulk', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: validRows.map((r) => ({
            title: r.title,
            description: r.description,
            edition_size: r.edition_size || null,
            price: r.price,
            sku: r.sku || undefined,
            product_type: r.product_type || undefined,
            tags: r.tags,
          })),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || 'Bulk upload failed')
      }
      toast({
        title: `${json.created} draft${json.created === 1 ? '' : 's'} created`,
        description: 'Add imagery + production files in Studio, then submit for approval.',
      })
      router.push('/vendor/studio?filter=draft')
    } catch (err: any) {
      toast({
        title: 'Bulk upload failed',
        description: err.message || 'Please retry.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-4 py-4 max-w-4xl mx-auto space-y-4">
      <div>
        <Link
          href="/vendor/studio"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1a1a1a]/60 hover:text-[#1a1a1a] font-body uppercase tracking-[0.15em]"
        >
          <ArrowLeft className="w-3 h-3" /> Studio
        </Link>
        <h1 className="font-heading text-2xl font-semibold text-[#1a1a1a] mt-2">Bulk upload artworks</h1>
        <p className="font-body text-sm text-[#1a1a1a]/60 mt-1 leading-relaxed">
          Paste a CSV to create up to 25 draft artworks in one shot. Each draft lands in Studio
          where you can add imagery, production files, and the collector experience before
          submitting for approval.
        </p>
      </div>

      <ContentCard padding="md">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50">
                Step 1 · Paste or upload
              </p>
              <p className="font-body text-[11px] text-[#1a1a1a]/50 mt-0.5">
                Required columns: <span className="font-semibold">title, price</span>. Optional:
                description, edition_size, sku, product_type, tags (pipe-separated).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#1a1a1a]/15 hover:border-[#1a1a1a]/40 text-[11px] font-bold font-body cursor-pointer">
                <Upload className="w-3 h-3" />
                Upload CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                />
              </label>
              <button
                type="button"
                onClick={loadSample}
                className="px-3 py-1.5 rounded-full border border-[#1a1a1a]/15 hover:border-[#1a1a1a]/40 text-[11px] font-bold font-body"
              >
                Load sample
              </button>
            </div>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={10}
            placeholder={SAMPLE_CSV}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs font-mono focus:border-impact-primary focus:outline-none"
          />
          {headerError && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{headerError}</span>
            </div>
          )}
        </div>
      </ContentCard>

      {parsed.rows.length > 0 && !headerError && (
        <ContentCard padding="md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50">
                  Step 2 · Preview
                </p>
                <p className="font-body text-xs text-[#1a1a1a]/70 mt-0.5">
                  {validRows.length} ready ·{' '}
                  {invalidRows.length > 0 && (
                    <span className="text-red-700 font-semibold">{invalidRows.length} need fixing</span>
                  )}
                  {invalidRows.length === 0 && <span>0 errors</span>}
                </p>
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={submitting || validRows.length === 0 || invalidRows.length > 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-impact-primary text-white text-xs font-bold font-body disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                {submitting ? 'Creating drafts…' : `Create ${validRows.length} draft${validRows.length === 1 ? '' : 's'}`}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-body border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-[#1a1a1a]/50 uppercase text-[10px] tracking-[0.15em]">
                    <th className="pb-2 pr-3">#</th>
                    <th className="pb-2 pr-3">Title</th>
                    <th className="pb-2 pr-3">Price</th>
                    <th className="pb-2 pr-3">Edition</th>
                    <th className="pb-2 pr-3">Tags</th>
                    <th className="pb-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((r) => (
                    <tr
                      key={r._rowIndex}
                      className={cn(
                        'border-t border-gray-100',
                        r._error && 'bg-red-50'
                      )}
                    >
                      <td className="py-2 pr-3 text-[#1a1a1a]/40 tabular-nums">{r._rowIndex}</td>
                      <td className="py-2 pr-3 font-semibold">{r.title || <em className="text-red-700">missing</em>}</td>
                      <td className="py-2 pr-3 tabular-nums">${r.price || '-'}</td>
                      <td className="py-2 pr-3 tabular-nums">{r.edition_size || '—'}</td>
                      <td className="py-2 pr-3">
                        {r.tags.length > 0 ? r.tags.join(', ') : <span className="text-[#1a1a1a]/40">—</span>}
                      </td>
                      <td className="py-2 pr-3">
                        {r._error ? (
                          <span className="text-red-700">{r._error}</span>
                        ) : (
                          <span className="text-emerald-700">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ContentCard>
      )}
    </div>
  )
}
