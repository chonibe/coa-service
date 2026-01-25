"use client";

import { useState } from 'react';
;
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from "@/components/ui"
export default function SyncOrderStatusesButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('/api/sync/order-statuses', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync order statuses');
      }

      toast.success(
        <div>
          <p>{data.message}</p>
          {data.stats && (
            <p className="text-sm text-muted-foreground mt-1">
              Updated: {data.stats.updatedCount} orders | 
              Cancelled: {data.stats.cancelledCount} orders | 
              Status Changes: {data.stats.statusChangedCount}
            </p>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error syncing order statuses:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync order statuses');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
      className="ml-4"
    >
      {isSyncing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing Statuses...
        </>
      ) : (
        'Sync Order Statuses'
      )}
    </Button>
  );
}

