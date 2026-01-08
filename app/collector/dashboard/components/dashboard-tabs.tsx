"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReactNode } from "react"

interface DashboardTabsProps {
  children: {
    overview: ReactNode
    collection: ReactNode
    editions: ReactNode
    artists: ReactNode
    certifications: ReactNode
    hiddenContent: ReactNode
    profile: ReactNode
  }
  defaultTab?: string
}

export function DashboardTabs({ children, defaultTab = "overview" }: DashboardTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-7 mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="collection">My Collection</TabsTrigger>
        <TabsTrigger value="editions">Editions</TabsTrigger>
        <TabsTrigger value="artists">Artists & Series</TabsTrigger>
        <TabsTrigger value="certifications">Certifications</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="hiddenContent">Hidden Content</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-6">
        {children.overview}
      </TabsContent>
      <TabsContent value="collection" className="mt-6">
        {children.collection}
      </TabsContent>
      <TabsContent value="editions" className="mt-6">
        {children.editions}
      </TabsContent>
      <TabsContent value="artists" className="mt-6">
        {children.artists}
      </TabsContent>
      <TabsContent value="certifications" className="mt-6">
        {children.certifications}
      </TabsContent>
      <TabsContent value="profile" className="mt-6">
        {children.profile}
      </TabsContent>
      <TabsContent value="hiddenContent" className="mt-6">
        {children.hiddenContent}
      </TabsContent>
    </Tabs>
  )
}

