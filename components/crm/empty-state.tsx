"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building2, Inbox, Search, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface EmptyStateProps {
  type: "people" | "companies" | "inbox" | "activities" | "search"
  title?: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const router = useRouter()

  const defaultConfig = {
    people: {
      icon: Users,
      title: "No people yet",
      description: "Get started by adding your first contact to the CRM.",
      actionLabel: "Add Person",
      actionHref: "/admin/crm/people/new",
    },
    companies: {
      icon: Building2,
      title: "No companies yet",
      description: "Start tracking companies by adding your first one.",
      actionLabel: "Add Company",
      actionHref: "/admin/crm/companies/new",
    },
    inbox: {
      icon: Inbox,
      title: "No conversations",
      description: "When you receive messages, they'll appear here.",
      actionLabel: null,
      actionHref: null,
    },
    activities: {
      icon: Search,
      title: "No activities",
      description: "Activities and interactions will appear in the timeline.",
      actionLabel: "Add Activity",
      actionHref: null,
    },
    search: {
      icon: Search,
      title: "No results found",
      description: "Try adjusting your search or filters.",
      actionLabel: null,
      actionHref: null,
    },
  }

  const config = defaultConfig[type]
  const Icon = config.icon

  const handleAction = () => {
    if (onAction) {
      onAction()
    } else if (actionHref || config.actionHref) {
      router.push(actionHref || config.actionHref || "#")
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {title || config.title}
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          {description || config.description}
        </p>
        {(actionLabel || config.actionLabel) && (
          <Button onClick={handleAction}>
            <Plus className="mr-2 h-4 w-4" />
            {actionLabel || config.actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

