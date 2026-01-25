'use client'

import { useState, useEffect } from 'react'
import { Button, Badge, Card } from '@/components/ui'
import { CheckCircle2, XCircle, ExternalLink, AlertTriangle, Info, Package } from 'lucide-react'
import { PolarisUpdate } from '@/lib/polaris-update-checker'

interface PolarisUpdateBannerProps {
  updates: PolarisUpdate[]
  onApprove: (updateId: string, notes?: string) => Promise<void>
  onReject: (updateId: string, reason: string) => Promise<void>
  onDismiss: () => void
}

export function PolarisUpdateBanner({ 
  updates, 
  onApprove, 
  onReject, 
  onDismiss 
}: PolarisUpdateBannerProps) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null)

  if (!updates || updates.length === 0) return null

  // Get update type priority (major > minor > patch)
  const highestPriority = updates.reduce((highest, update) => {
    const priority = { major: 3, minor: 2, patch: 1 }
    return priority[update.update_type] > priority[highest.update_type] 
      ? update 
      : highest
  })

  const updateTypeInfo = {
    major: {
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200 text-red-900',
      badge: 'critical',
      label: 'Major Update',
      description: 'Contains breaking changes - requires review'
    },
    minor: {
      icon: Info,
      color: 'bg-blue-50 border-blue-200 text-blue-900',
      badge: 'attention',
      label: 'Minor Update',
      description: 'New features available - backwards compatible'
    },
    patch: {
      icon: Package,
      color: 'bg-green-50 border-green-200 text-green-900',
      badge: 'success',
      label: 'Patch Update',
      description: 'Bug fixes and improvements'
    }
  }

  const info = updateTypeInfo[highestPriority.update_type]
  const Icon = info.icon

  const handleApprove = async (updateId: string) => {
    setLoading(updateId)
    try {
      await onApprove(updateId, 'Approved from admin dashboard')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async (updateId: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    
    setLoading(updateId)
    try {
      await onReject(updateId, rejectReason)
      setShowRejectDialog(null)
      setRejectReason('')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={`border-b ${info.color} transition-all duration-300`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon and Message */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Icon className="h-5 w-5 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone={info.badge as any} size="small">
                  {info.label}
                </Badge>
                <span className="font-semibold">
                  {updates.length === 1 
                    ? `Polaris ${highestPriority.latest_version} available`
                    : `${updates.length} Polaris updates available`
                  }
                </span>
              </div>
              {!expanded && (
                <p className="text-sm opacity-80 mt-0.5">
                  {info.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="plain"
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Hide Details' : 'View Details'}
            </Button>
            
            <button
              onClick={onDismiss}
              className="p-1 hover:opacity-70 transition-opacity"
              aria-label="Dismiss"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 space-y-3">
            {updates.map(update => (
              <Card key={update.id} className="p-4">
                <div className="space-y-3">
                  {/* Package Info */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-white/50 px-2 py-0.5 rounded">
                          {update.package_name}
                        </code>
                        <Badge tone={updateTypeInfo[update.update_type].badge as any}>
                          {update.update_type}
                        </Badge>
                      </div>
                      
                      <div className="mt-2 text-sm">
                        <span className="opacity-70">Version:</span>{' '}
                        <span className="font-mono">{update.current_version}</span>
                        {' → '}
                        <span className="font-mono font-semibold">{update.latest_version}</span>
                      </div>

                      {/* Links */}
                      <div className="mt-2 flex gap-3">
                        <a
                          href={update.changelog_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          View Changelog <ExternalLink className="h-3 w-3" />
                        </a>
                        
                        {update.migration_guide_url && (
                          <a
                            href={update.migration_guide_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            Migration Guide <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {showRejectDialog === update.id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="Reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="px-3 py-1.5 text-sm border rounded"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              size="small"
                              onClick={() => handleReject(update.id)}
                              loading={loading === update.id}
                            >
                              Confirm Reject
                            </Button>
                            <Button
                              variant="plain"
                              size="small"
                              onClick={() => {
                                setShowRejectDialog(null)
                                setRejectReason('')
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => handleApprove(update.id)}
                            loading={loading === update.id}
                            icon={<CheckCircle2 className="h-4 w-4" />}
                          >
                            Approve
                          </Button>
                          
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => setShowRejectDialog(update.id)}
                            disabled={loading !== null}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Warning for major updates */}
                  {update.update_type === 'major' && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
                      <div className="flex gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-900">Breaking Changes Expected</p>
                          <p className="text-amber-800 mt-1">
                            This is a major version update and may contain breaking changes. 
                            Please review the migration guide before approving.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {/* Action Summary */}
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm opacity-70">
                {updates.length === 1 
                  ? 'Approve to create an update PR automatically'
                  : `${updates.length} packages will be updated together`
                }
              </p>
              
              <Button
                variant="primary"
                onClick={() => {
                  updates.forEach(update => handleApprove(update.id))
                }}
                loading={loading !== null}
                disabled={updates.some(u => u.update_type === 'major')}
              >
                {updates.some(u => u.update_type === 'major')
                  ? 'Review Each Update'
                  : `Approve All ${updates.length} Updates`
                }
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
