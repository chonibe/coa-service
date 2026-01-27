"use client"

import { ReactNode } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
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
      <div className="mb-8 px-2">
        <TabsList className="bg-slate-100/80 p-1 rounded-full border border-slate-200/50 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-black text-xs uppercase tracking-widest transition-all">Overview</TabsTrigger>
          <TabsTrigger value="collection" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-black text-xs uppercase tracking-widest transition-all">My Collection</TabsTrigger>
          {/* Hidden tabs: Editions, Certifications, Profile, Hidden Content */}
          <TabsTrigger value="artists" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-black text-xs uppercase tracking-widest transition-all">Artists & Series</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="overview" className="mt-0">
        {children.overview}
      </TabsContent>
      <TabsContent value="collection" className="mt-0">
        {children.collection}
      </TabsContent>
      {/* Hidden tab contents: Editions, Certifications, Profile, Hidden Content */}
      <TabsContent value="artists" className="mt-0">
        {children.artists}
      </TabsContent>
    </Tabs>
  )
}

