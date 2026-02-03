"use client"

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui"
import { EyeIcon } from "@heroicons/react/24/outline"

interface TemplatePreviewProps {
  preview: {
    subject: string
    html: string
    sampleData: Record<string, string>
  } | null
  loading: boolean
}

export function TemplatePreview({ preview, loading }: TemplatePreviewProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <EyeIcon className="h-4 w-4" />
          Live Preview
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          )}
        </CardTitle>
        <CardDescription>
          Preview with sample data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="preview">Email Preview</TabsTrigger>
            <TabsTrigger value="data">Sample Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview">
            {preview && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Subject:</div>
                  <div className="font-medium">{preview.subject}</div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={preview.html}
                    className="w-full h-[500px] bg-white"
                    title="Email Preview"
                  />
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="data">
            {preview?.sampleData && (
              <div className="space-y-2">
                {Object.entries(preview.sampleData).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <code className="text-xs font-mono text-primary">{`{{${key}}}`}</code>
                    <span className="text-muted-foreground">=</span>
                    <span className="text-sm">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
