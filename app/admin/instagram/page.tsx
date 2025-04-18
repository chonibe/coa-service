"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Instagram, AlertTriangle, CheckCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function InstagramAdminPage() {
  const [username, setUsername] = useState("")
  const [postUrls, setPostUrls] = useState<string[]>([])
  const [currentUrl, setCurrentUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const hasError = searchParams.get("error")
  const hasSuccess = searchParams.get("success")

  // Handle adding a post URL
  const handleAddUrl = () => {
    if (!currentUrl) return

    try {
      // Validate URL format
      const url = new URL(currentUrl)
      if (!url.hostname.includes("instagram.com")) {
        setError("Please enter a valid Instagram post URL")
        return
      }

      // Add URL to list
      setPostUrls([...postUrls, currentUrl])
      setCurrentUrl("")
      setSuccess("Instagram post added successfully")

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Please enter a valid URL")
    }
  }

  // Handle removing a post URL
  const handleRemoveUrl = (index: number) => {
    const newUrls = [...postUrls]
    newUrls.splice(index, 1)
    setPostUrls(newUrls)
  }

  // Handle saving all settings
  const handleSave = () => {
    // In a real implementation, you would save this to your database
    setSuccess("Instagram settings saved successfully")

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Instagram Integration</h1>

      {(error || hasError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p>{error || "There was an error with your Instagram integration"}</p>
        </div>
      )}

      {(success || hasSuccess) && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p>{success || "Instagram integration successful"}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-500" />
            <span>Instagram Embed Settings</span>
          </CardTitle>
          <CardDescription>Configure Instagram posts to display to your collectors</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Instagram Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. streetcollector_"
            />
            <p className="text-sm text-gray-500">Enter your Instagram username without the @ symbol</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-url">Add Instagram Post</Label>
            <div className="flex gap-2">
              <Input
                id="post-url"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="https://www.instagram.com/p/POSTID/"
              />
              <Button onClick={handleAddUrl}>Add</Button>
            </div>
            <p className="text-sm text-gray-500">Paste the URL of an Instagram post you want to display</p>
          </div>

          {postUrls.length > 0 && (
            <div className="space-y-2">
              <Label>Added Posts</Label>
              <div className="border rounded-md divide-y">
                {postUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-3">
                    <div className="truncate flex-1">{url}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUrl(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button onClick={handleSave} className="ml-auto">
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
