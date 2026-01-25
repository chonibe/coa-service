"use client"

import { Building2, Briefcase, MapPin, Link as LinkIcon, User, Mail, Phone, Calendar } from "lucide-react"


import { Separator } from "@/components/ui"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate } from "@/lib/utils"

import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui"
export interface EnrichmentData {
  company?: string
  job_title?: string
  location?: string
  linkedin?: string
  twitter?: string
  github?: string
  website?: string
  profile_picture?: string
  bio?: string
  phone?: string
  email?: string
  verified?: boolean
  source?: string
  last_updated?: string
}

export interface EnrichmentPanelProps {
  customer: {
    id: string
    email: string | null
    first_name: string | null
    last_name: string | null
    phone?: string | null
    enrichment_data?: EnrichmentData | null
    total_orders?: number | null
    total_spent?: number | null
    first_order_date?: string | null
    last_order_date?: string | null
  }
  className?: string
}

export function EnrichmentPanel({ customer, className = "" }: EnrichmentPanelProps) {
  const enrichment = customer.enrichment_data || {}
  const hasEnrichment = Object.keys(enrichment).length > 0

  const getInitials = () => {
    const firstName = customer.first_name || ""
    const lastName = customer.last_name || ""
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?"
    }
    if (customer.email) {
      return customer.email.charAt(0).toUpperCase()
    }
    return "?"
  }

  const getFullName = () => {
    if (customer.first_name || customer.last_name) {
      return `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
    }
    return customer.email || "Unknown"
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Profile Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={enrichment.profile_picture || undefined}
                alt={getFullName()}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{getFullName()}</CardTitle>
              {enrichment.job_title && (
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {enrichment.job_title}
                </p>
              )}
              {enrichment.company && (
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Building2 className="h-3 w-3" />
                  {enrichment.company}
                </p>
              )}
            </div>
            {enrichment.verified && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Verified
              </Badge>
            )}
          </div>
        </CardHeader>
        {enrichment.bio && (
          <CardContent className="pt-0">
            <p className="text-sm text-gray-600">{enrichment.bio}</p>
          </CardContent>
        )}
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {customer.email && (
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-0.5">Email</div>
                <div className="text-sm text-gray-900 break-all">{customer.email}</div>
              </div>
            </div>
          )}
          {(customer.phone || enrichment.phone) && (
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-0.5">Phone</div>
                <div className="text-sm text-gray-900">{customer.phone || enrichment.phone}</div>
              </div>
            </div>
          )}
          {enrichment.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-0.5">Location</div>
                <div className="text-sm text-gray-900">{enrichment.location}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Information */}
      {enrichment.company && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Company Name</div>
                <div className="text-sm font-medium text-gray-900">{enrichment.company}</div>
              </div>
              {enrichment.job_title && (
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Job Title</div>
                  <div className="text-sm text-gray-900">{enrichment.job_title}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Profiles */}
      {(enrichment.linkedin || enrichment.twitter || enrichment.github || enrichment.website) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Social Profiles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {enrichment.linkedin && (
              <a
                href={enrichment.linkedin.startsWith("http") ? enrichment.linkedin : `https://linkedin.com/in/${enrichment.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                <LinkIcon className="h-3 w-3" />
                LinkedIn
              </a>
            )}
            {enrichment.twitter && (
              <a
                href={enrichment.twitter.startsWith("http") ? enrichment.twitter : `https://twitter.com/${enrichment.twitter.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                <LinkIcon className="h-3 w-3" />
                Twitter
              </a>
            )}
            {enrichment.github && (
              <a
                href={enrichment.github.startsWith("http") ? enrichment.github : `https://github.com/${enrichment.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                <LinkIcon className="h-3 w-3" />
                GitHub
              </a>
            )}
            {enrichment.website && (
              <a
                href={enrichment.website.startsWith("http") ? enrichment.website : `https://${enrichment.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                <LinkIcon className="h-3 w-3" />
                Website
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order History */}
      {(customer.total_orders && customer.total_orders > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Order History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Orders</span>
              <span className="font-semibold text-gray-900">{customer.total_orders}</span>
            </div>
            {customer.total_spent && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Spent</span>
                <span className="font-semibold text-gray-900">
                  ${parseFloat(customer.total_spent.toString()).toFixed(2)}
                </span>
              </div>
            )}
            {customer.first_order_date && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">First Order</span>
                <span className="text-sm text-gray-900">
                  {formatDate(customer.first_order_date)}
                </span>
              </div>
            )}
            {customer.last_order_date && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Order</span>
                <span className="text-sm text-gray-900">
                  {formatDate(customer.last_order_date)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enrichment Source */}
      {enrichment.source && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Data Source</div>
                <div className="text-sm font-medium text-gray-900 capitalize">{enrichment.source}</div>
              </div>
              {enrichment.last_updated && (
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-0.5">Last Updated</div>
                  <div className="text-sm text-gray-600">
                    {formatDate(enrichment.last_updated)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Enrichment State */}
      {!hasEnrichment && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No enrichment data available</p>
              <p className="text-xs text-gray-400 mt-1">
                Enrichment data will appear here when available
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

