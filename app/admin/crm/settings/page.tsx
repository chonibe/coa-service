"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Mail, Facebook, MessageCircle, Settings as SettingsIcon } from "lucide-react"
import Link from "next/link"

export default function CRMSettingsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">CRM Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your CRM integrations and preferences
        </p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="fields">Custom Fields</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Email Accounts */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  <CardTitle>Email Accounts</CardTitle>
                </div>
                <CardDescription>
                  Manage multiple email accounts for syncing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/crm/settings/email-accounts">
                  <Button variant="outline" className="w-full">
                    Manage Email Accounts
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Facebook */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Facebook className="h-5 w-5" />
                  <CardTitle>Facebook</CardTitle>
                </div>
                <CardDescription>
                  Connect Facebook Pages for Messenger
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/crm/settings/integrations?platform=facebook">
                  <Button variant="outline" className="w-full">
                    Connect Facebook
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* WhatsApp */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <CardTitle>WhatsApp</CardTitle>
                </div>
                <CardDescription>
                  Connect WhatsApp Business API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/crm/settings/integrations?platform=whatsapp">
                  <Button variant="outline" className="w-full">
                    Connect WhatsApp
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Instagram */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  <CardTitle>Instagram</CardTitle>
                </div>
                <CardDescription>
                  Instagram messaging integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  Configure Instagram
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
              <CardDescription>
                Define custom fields for people, companies, and other entities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/crm/settings/fields">
                <Button variant="outline" className="w-full">
                  Manage Custom Fields
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general CRM preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                General settings coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

