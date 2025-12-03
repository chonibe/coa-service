"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, Merge, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MergeDialogProps {
  targetRecord: {
    id: string
    email?: string | null
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
    [key: string]: any
  }
  sourceRecord: {
    id: string
    email?: string | null
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
    [key: string]: any
  }
  onMergeComplete?: () => void
}

export function MergeDialog({
  targetRecord,
  sourceRecord,
  onMergeComplete,
}: MergeDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [conflictResolution, setConflictResolution] = useState<Record<string, string>>({})

  // Identify conflicts (fields where both records have different non-null values)
  const conflicts: Array<{ field: string; target: any; source: any }> = []
  const fieldsToCheck = ["email", "first_name", "last_name", "phone", "notes"]

  fieldsToCheck.forEach((field) => {
    const targetValue = targetRecord[field]
    const sourceValue = sourceRecord[field]
    if (
      targetValue &&
      sourceValue &&
      targetValue !== sourceValue &&
      String(targetValue).trim() !== String(sourceValue).trim()
    ) {
      conflicts.push({ field, target: targetValue, source: sourceValue })
      // Default resolution: keep target
      if (!conflictResolution[field]) {
        setConflictResolution((prev) => ({ ...prev, [field]: "keep_target" }))
      }
    }
  })

  const handleMerge = async () => {
    setIsMerging(true)
    try {
      const response = await fetch("/api/crm/contacts/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merged_into_customer_id: targetRecord.id,
          merged_from_customer_id: sourceRecord.id,
          merge_reason: "User-initiated merge via UI",
          conflict_resolution: conflictResolution,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to merge records")
      }

      toast({
        variant: "success",
        title: "Success",
        description: "Records merged successfully",
      })

      setIsOpen(false)
      if (onMergeComplete) {
        onMergeComplete()
      }
    } catch (err: any) {
      console.error("Error merging records:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to merge records",
      })
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Merge className="mr-2 h-4 w-4" />
          Merge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge Records</DialogTitle>
          <DialogDescription>
            Merge {sourceRecord.first_name || sourceRecord.email || "source record"} into{" "}
            {targetRecord.first_name || targetRecord.email || "target record"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Target Record (Keep)</CardTitle>
                <CardDescription>
                  {targetRecord.first_name} {targetRecord.last_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {targetRecord.email && (
                  <div>
                    <span className="font-medium">Email:</span> {targetRecord.email}
                  </div>
                )}
                {targetRecord.phone && (
                  <div>
                    <span className="font-medium">Phone:</span> {targetRecord.phone}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Source Record (Merge From)</CardTitle>
                <CardDescription>
                  {sourceRecord.first_name} {sourceRecord.last_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {sourceRecord.email && (
                  <div>
                    <span className="font-medium">Email:</span> {sourceRecord.email}
                  </div>
                )}
                {sourceRecord.phone && (
                  <div>
                    <span className="font-medium">Phone:</span> {sourceRecord.phone}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Conflict resolution */}
          {conflicts.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium">Resolve Conflicts</h4>
              {conflicts.map((conflict) => (
                <Card key={conflict.field}>
                  <CardHeader>
                    <CardTitle className="text-sm capitalize">{conflict.field}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={conflictResolution[conflict.field] || "keep_target"}
                      onValueChange={(value) =>
                        setConflictResolution((prev) => ({
                          ...prev,
                          [conflict.field]: value,
                        }))
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="keep_target" id={`${conflict.field}-target`} />
                        <Label htmlFor={`${conflict.field}-target`} className="flex-1">
                          <div className="font-medium">Keep Target</div>
                          <div className="text-sm text-muted-foreground">
                            {String(conflict.target)}
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="keep_source" id={`${conflict.field}-source`} />
                        <Label htmlFor={`${conflict.field}-source`} className="flex-1">
                          <div className="font-medium">Keep Source</div>
                          <div className="text-sm text-muted-foreground">
                            {String(conflict.source)}
                          </div>
                        </Label>
                      </div>
                      {conflict.field === "notes" && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="merge" id={`${conflict.field}-merge`} />
                          <Label htmlFor={`${conflict.field}-merge`} className="flex-1">
                            <div className="font-medium">Merge Both</div>
                            <div className="text-sm text-muted-foreground">
                              Combine both values
                            </div>
                          </Label>
                        </div>
                      )}
                    </RadioGroup>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              No conflicts detected. Records will be merged automatically.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isMerging}>
              Cancel
            </Button>
            <Button onClick={handleMerge} disabled={isMerging}>
              {isMerging ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <Merge className="mr-2 h-4 w-4" />
                  Merge Records
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

