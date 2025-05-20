"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/lib/utils';
import { AlertCircle } from "lucide-react";

interface OrderLineItem {
  id: string;
  title: string;
  product_id: string;
  status: "active" | "inactive" | "removed";
}

interface DuplicateItemsBoxProps {
  lineItems: OrderLineItem[];
  onStatusChange: (itemIds: string[], status: "active" | "inactive" | "removed") => void;
}

export default function DuplicateItemsBox({ lineItems, onStatusChange }: DuplicateItemsBoxProps) {
  // Find duplicate items (only among active items)
  const duplicates = new Map<string, string[]>();
  const seen = new Map<string, string[]>();

  lineItems
    .filter(item => item.status === 'active') // Only consider active items for duplicates
    .forEach(item => {
      if (item.product_id) {
        if (seen.has(item.product_id)) {
          const existing = seen.get(item.product_id) || [];
          existing.push(item.id);
          seen.set(item.product_id, existing);
          // Add all items with this product_id to duplicates
          existing.forEach(id => {
            const current = duplicates.get(id) || [];
            duplicates.set(id, [...current, ...existing.filter(i => i !== id)]);
          });
        } else {
          seen.set(item.product_id, [item.id]);
        }
      }
    });

  if (duplicates.size === 0) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          Duplicate Items Detected
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from(duplicates.entries()).map(([itemId, duplicateIds]) => {
            const item = lineItems.find(i => i.id === itemId);
            if (!item) return null;

            return (
              <div key={itemId} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-yellow-700">
                    {duplicateIds.length} duplicate{duplicateIds.length > 1 ? 's' : ''} found
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange([itemId, ...duplicateIds], 'inactive')}
                  >
                    Mark All Inactive
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onStatusChange([itemId, ...duplicateIds], 'removed')}
                  >
                    Remove All
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 