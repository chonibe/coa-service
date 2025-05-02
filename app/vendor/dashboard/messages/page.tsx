"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
import { SidebarLayout } from "../../components/sidebar-layout"

export default function MessagesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  return (
    <SidebarLayout>
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
    </SidebarLayout>
  )
}
