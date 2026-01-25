'use client'

import { useEffect, useState } from 'react'
import { PolarisUpdate } from '@/lib/polaris-update-checker'
import { PolarisUpdateBanner } from './polaris-update-banner'

/**
 * Polaris Update Notifications Component
 * 
 * Displays announcement banner for Polaris updates in admin dashboard
 * Checks for updates every 6 hours
 */
export function PolarisUpdateNotifications() {
  const [updates, setUpdates] = useState<PolarisUpdate[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)

  const checkForUpdates = async () => {
    try {
      const response = await fetch('/api/polaris-updates')
      const data = await response.json()
      
      if (data.success && data.updates?.length > 0) {
        setUpdates(data.updates)
        setDismissed(false)
      }
    } catch (error) {
      console.error('Failed to check for Polaris updates:', error)
    }
  }

  // Check on mount and every 6 hours
  useEffect(() => {
    checkForUpdates()
    
    const interval = setInterval(checkForUpdates, 6 * 60 * 60 * 1000) // 6 hours
    
    return () => clearInterval(interval)
  }, [])

  const handleApprove = async (updateId: string, notes?: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/polaris-updates/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateId, notes }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Show success message
        alert(`Update approved! ${data.prUrl ? `PR created: ${data.prUrl}` : 'PR will be created automatically.'}`)
        
        // Remove from pending list
        setUpdates(prev => prev.filter(u => u.id !== updateId))
      } else {
        alert(`Failed to approve update: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to approve update:', error)
      alert('Failed to approve update. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (updateId: string, reason: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/polaris-updates/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateId, reason }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Update rejected.')
        setUpdates(prev => prev.filter(u => u.id !== updateId))
      } else {
        alert(`Failed to reject update: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to reject update:', error)
      alert('Failed to reject update. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Store in localStorage to remember dismissal
    localStorage.setItem('polaris-updates-dismissed', Date.now().toString())
  }

  // Don't show if dismissed or no updates
  if (dismissed || updates.length === 0) return null

  return (
    <PolarisUpdateBanner
      updates={updates}
      onApprove={handleApprove}
      onReject={handleReject}
      onDismiss={handleDismiss}
    />
  )
}
