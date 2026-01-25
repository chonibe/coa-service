"use client"

import React from "react"
import { AlertCircle, Settings, Smartphone, MoveHorizontal } from "lucide-react"

import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui"

interface NFCTroubleshootingProps {
  onUseManualCode: () => void
}

export function NFCTroubleshooting({ onUseManualCode }: NFCTroubleshootingProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="w-full py-3 text-sm text-muted-foreground
                                      flex items-center justify-center gap-2
                                      hover:text-foreground transition-colors">
        <AlertCircle className="w-4 h-4" />
        Having trouble?
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-muted/50 rounded-xl p-4 space-y-4 text-sm">
          <div className="flex gap-3">
            <Settings className="w-5 h-5 flex-shrink-0 text-primary" />
            <div>
              <p className="font-medium mb-1">Make sure NFC is enabled</p>
              <p className="text-muted-foreground text-xs">
                Check your phone's settings to ensure NFC is turned on
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Smartphone className="w-5 h-5 flex-shrink-0 text-primary" />
            <div>
              <p className="font-medium mb-1">Try removing your phone case</p>
              <p className="text-muted-foreground text-xs">
                Some cases can interfere with NFC signals
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <MoveHorizontal className="w-5 h-5 flex-shrink-0 text-primary" />
            <div>
              <p className="font-medium mb-1">Move your phone slowly</p>
              <p className="text-muted-foreground text-xs">
                Glide your phone across the tag area to find the NFC chip
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <p className="text-muted-foreground text-xs mb-2">
              Still having issues?
            </p>
            <Button
              onClick={onUseManualCode}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Enter code manually instead
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
