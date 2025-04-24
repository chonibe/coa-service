"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  autoAssignEditions: z.boolean().default(true),
  editionFormat: z.enum(["number", "number-of-total", "custom"]).default("number"),
  updateShopify: z.boolean().default(true),
  syncOnWebhook: z.boolean().default(true),
})

export default function SettingsPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      autoAssignEditions: true,
      editionFormat: "number",
      updateShopify: true,
      syncOnWebhook: true,
    },
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSaveSettings = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true)
    // In a real app, this would save to your backend
    console.log("Saving settings:", values)
    // Show a toast or notification
    setIsSaving(false)
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Configure your edition numbering system</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveSettings)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Edition Numbering</CardTitle>
                <CardDescription>Configure how edition numbers are assigned and displayed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="autoAssignEditions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <FormLabel className="text-right">Auto-assign edition numbers</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="editionFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Edition number format</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="number">Number only (e.g., 42)</SelectItem>
                          <SelectItem value="number-of-total">Number of total (e.g., 42/100)</SelectItem>
                          <SelectItem value="custom">Custom format</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  Save Settings
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Configure advanced options for the edition numbering system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="updateShopify"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <FormLabel className="text-right">Update Shopify line items</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="syncOnWebhook"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <FormLabel className="text-right">Sync on webhook</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  Save Settings
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  )
}
