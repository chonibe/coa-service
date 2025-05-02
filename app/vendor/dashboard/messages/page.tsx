"use client"

import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
import { SidebarLayout } from "../../components/sidebar-layout"

// Separate the content into its own component
function MessagesContent() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Communicate with your customers and the platform team</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>View and respond to messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              When you receive messages from customers or the platform team, they will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main page component with Suspense boundary
export default function MessagesPage() {
  return (
    <SidebarLayout>
      <Suspense
        fallback={
          <div className="p-6">
            <div className="mb-6 h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-64 bg-gray-200 animate-pulse rounded mb-6"></div>
            <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
          </div>
        }
      >
        <MessagesContent />
      </Suspense>
    </SidebarLayout>
  )
}
