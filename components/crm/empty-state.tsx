"use client"



import { Users, Building2, Inbox, Search, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import { Card, CardContent, Button } from "@/components/ui"
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
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 mb-6">
          <Icon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold mb-3 text-center">
          {title || config.title}
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
          {description || config.description}
        </p>
        {(actionLabel || config.actionLabel) && (
          <Button 
            onClick={handleAction}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            {actionLabel || config.actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

