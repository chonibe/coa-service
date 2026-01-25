"use client"




import { Info } from "lucide-react"

import { Label, RadioGroup, RadioGroupItem, Card } from "@/components/ui"
interface CollectionTypeSelectorProps {
  value: "manual" | "smart"
  onChange: (value: "manual" | "smart") => void
}

export function CollectionTypeSelector({ value, onChange }: CollectionTypeSelectorProps) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
      <Card
        className={`p-4 cursor-pointer transition-all ${
          value === "manual"
            ? "border-primary ring-2 ring-primary ring-offset-2"
            : "border-border hover:border-primary/50"
        }`}
        onClick={() => onChange("manual")}
      >
        <div className="flex items-start gap-3">
          <RadioGroupItem value="manual" id="manual" />
          <div className="flex-1">
            <Label htmlFor="manual" className="text-base font-semibold cursor-pointer">
              Manual
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Add artworks to this collection one by one.{" "}
              <a
                href="https://help.shopify.com/manual/products/collections/collection-layout#manual-collections"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                Learn more about manual collections
                <Info className="h-3 w-3" />
              </a>
            </p>
          </div>
        </div>
      </Card>

      <Card
        className={`p-4 cursor-pointer transition-all ${
          value === "smart"
            ? "border-primary ring-2 ring-primary ring-offset-2"
            : "border-border hover:border-primary/50"
        }`}
        onClick={() => onChange("smart")}
      >
        <div className="flex items-start gap-3">
          <RadioGroupItem value="smart" id="smart" />
          <div className="flex-1">
            <Label htmlFor="smart" className="text-base font-semibold cursor-pointer">
              Smart
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Existing and future artworks that match the conditions you set will automatically be
              added to this collection.{" "}
              <a
                href="https://help.shopify.com/manual/products/collections/collection-layout#smart-collections"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                Learn more about smart collections
                <Info className="h-3 w-3" />
              </a>
            </p>
          </div>
        </div>
      </Card>
    </RadioGroup>
  )
}
