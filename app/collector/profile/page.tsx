'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'







import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Loader2, History as HistoryIcon, Save, User, Eye, Sparkles } from 'lucide-react'
import { InkOGatchiWidget } from '@/app/collector/dashboard/components/inkogatchi-widget'
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

export default function CollectorProfilePage() {
  const [profile, setProfile] = useState<CollectorProfile | null>(null)
  const [changes, setChanges] = useState<ProfileChange[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    avatar_url: ''
  })

  const { toast } = useToast()
  const router = useRouter()

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Collector Profile</h1>
            <p className="text-gray-600">
              Manage your collector profile and view your change history.
              Your name preferences will be used for future edition certificates.
            </p>
          </div>
          <Link href="/collector/profile/comprehensive">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Complete Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <InkOGatchiWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
            <CardContent className="space-y-6">
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
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://..."
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
                <HistoryIcon className="h-5 w-5" />
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
                <div className="space-y-4">
                  {changes.map((change, index) => (
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
                        <Badge variant={change.change_type === 'created' ? 'default' : 'secondary'}>
                          {change.change_type}
                        </Badge>
                      </div>
                      {index < changes.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {profile && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Profile Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm">{new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm">{new Date(profile.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Changes Made</span>
                  <span className="text-sm">{changes.length}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
