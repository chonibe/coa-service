'use client'

import { useState, useEffect } from 'react'

import { Separator } from "@/components/ui"
import { useToast } from '@/hooks/use-toast'
import { Loader2, History, Save, User, Link as LinkIcon, Mail, ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { Button, Input, Label, Textarea, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription, Badge } from "@/components/ui"
interface CollectorProfile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface ProfileChange {
  id: number
  change_type: 'created' | 'updated'
  changed_fields: string[]
  old_values: Record<string, any>
  new_values: Record<string, any>
  reason: string | null
  created_at: string
}

export function ProfileSection() {
  const [profile, setProfile] = useState<CollectorProfile | null>(null)
  const [changes, setChanges] = useState<ProfileChange[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)
  const [guestEmail, setGuestEmail] = useState('')
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    avatar_url: ''
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
    fetchChangeHistory()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/collector/profile')
      const data = await response.json()

      if (data.success) {
        setProfile(data.profile)
        setFormData({
          first_name: data.profile.first_name || '',
          last_name: data.profile.last_name || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          bio: data.profile.bio || '',
          avatar_url: data.profile.avatar_url || ''
        })
      } else {
        toast({
          title: 'Error',
          description: data.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchChangeHistory = async () => {
    try {
      const response = await fetch('/api/collector/profile/history')
      const data = await response.json()

      if (data.success) {
        setChanges(data.history)
      }
    } catch (error) {
      // Silently fail for history - not critical
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/collector/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setProfile(data.profile)
        await fetchChangeHistory() // Refresh change history

        toast({
          title: 'Success',
          description: 'Profile updated successfully'
        })
      } else {
        toast({
          title: 'Error',
          description: data.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLinkGuestPurchases = async () => {
    if (!guestEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive'
      })
      return
    }

    setLinking(true)
    try {
      const response = await fetch('/api/collector/link-guest-purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: guestEmail.trim() })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message
        })
        setGuestEmail('')
        // Refresh profile and potentially re-run edition assignment
        await fetchProfile()
      } else {
        toast({
          title: 'Error',
          description: data.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to link guest purchases',
        variant: 'destructive'
      })
    } finally {
      setLinking(false)
    }
  }

  const formatChangeDescription = (change: ProfileChange) => {
    if (change.change_type === 'created') {
      return 'Profile created'
    }

    const fieldNames: Record<string, string> = {
      first_name: 'First Name',
      last_name: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      bio: 'Bio',
      avatar_url: 'Avatar'
    }

    const changedFieldNames = change.changed_fields
      .map(field => fieldNames[field] || field)
      .join(', ')

    return `Updated: ${changedFieldNames}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Comprehensive Profile Link */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Complete Collector Profile</h3>
              <p className="text-sm text-gray-600">
                View your comprehensive collector profile with all editions, orders, and activity history
              </p>
            </div>
            <Link href="/collector/profile/comprehensive">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Link Guest Purchases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Link Guest Purchases
          </CardTitle>
          <CardDescription>
            If you've made purchases as a guest, enter the email address you used to link them to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="guest_email">Email Address</Label>
              <Input
                id="guest_email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Enter email from guest purchase"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleLinkGuestPurchases} disabled={linking}>
                {linking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Linking...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Link Purchases
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your preferred name and contact information.
                This information will be used on your edition certificates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Change History */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Change History
              </CardTitle>
              <CardDescription>
                View all changes to your profile. This history is preserved for transparency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {changes.length === 0 ? (
                <p className="text-gray-500 text-sm">No changes yet</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {changes.slice(0, 10).map((change, index) => (
                    <div key={change.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {formatChangeDescription(change)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(change.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={change.change_type === 'created' ? 'default' : 'secondary'} className="ml-2">
                          {change.change_type}
                        </Badge>
                      </div>
                      {index < changes.slice(0, 10).length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                  {changes.length > 10 && (
                    <p className="text-xs text-gray-500 text-center mt-4">
                      And {changes.length - 10} more changes...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
