"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { AttioInbox } from "@/components/crm/inbox/attio-inbox"

function InboxContent() {
  const searchParams = useSearchParams()
  const platform = searchParams.get("platform") || undefined
  const status = searchParams.get("status") || undefined

  return (
    <div className="h-[calc(100vh-8rem)]">
      <AttioInbox initialPlatform={platform} initialStatus={status} />
    </div>
  )
}

export default function InboxPage() {
  return (
    <div className="h-full">
      <div className="p-6 border-b bg-background">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Inbox
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage conversations across all platforms
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <InboxContent />
      </Suspense>
    </div>
  )
}
