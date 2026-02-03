"use client"

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Switch,
} from "@/components/ui"
import { 
  CodeBracketIcon,
  CheckIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline"

interface TemplateEditorProps {
  template: {
    name: string
    description: string | null
    subject: string
    html_body: string
    variables: Array<{ name: string; description: string; example: string }>
    enabled: boolean
  }
  subject: string
  htmlBody: string
  enabled: boolean
  hasChanges: boolean
  saving: boolean
  onSubjectChange: (value: string) => void
  onHtmlBodyChange: (value: string) => void
  onEnabledChange: (value: boolean) => void
  onSave: () => void
  onReset: () => void
  onSendTest: () => void
  onInsertVariable: (variableName: string) => void
}

export function TemplateEditor({
  template,
  subject,
  htmlBody,
  enabled,
  hasChanges,
  saving,
  onSubjectChange,
  onHtmlBodyChange,
  onEnabledChange,
  onSave,
  onReset,
  onSendTest,
  onInsertVariable,
}: TemplateEditorProps) {
  return (
    <div className="space-y-6">
      {/* Subject Line */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Subject Line</CardTitle>
          <CardDescription>
            Use {"{{variableName}}"} to insert dynamic content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Email subject line..."
          />
        </CardContent>
      </Card>

      {/* Variables */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Available Variables</CardTitle>
          <CardDescription>
            Click to insert into the editor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {template.variables.map((variable) => (
              <Button
                key={variable.name}
                variant="outline"
                size="sm"
                onClick={() => onInsertVariable(variable.name)}
                className="font-mono text-xs"
                title={`${variable.description}\nExample: ${variable.example}`}
              >
                {`{{${variable.name}}}`}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* HTML Editor */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CodeBracketIcon className="h-4 w-4" />
            HTML Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="html-editor"
            value={htmlBody}
            onChange={(e) => onHtmlBodyChange(e.target.value)}
            className="font-mono text-xs min-h-[400px] resize-y"
            placeholder="Enter HTML template..."
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            id="enabled-toggle"
          />
          <Label htmlFor="enabled-toggle" className="text-sm">
            {enabled ? "Enabled" : "Disabled"}
          </Label>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onSendTest}
          >
            <PaperAirplaneIcon className="h-4 w-4 mr-2" />
            Send Test
          </Button>
          
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
