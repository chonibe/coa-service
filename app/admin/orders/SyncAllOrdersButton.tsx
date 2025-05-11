"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SyncAllOrdersButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('/api/sync/all-orders', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync orders');
      }

      toast.success(
        <div>
          <p>{data.message}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Total Orders: {data.stats.totalOrders} | 
            Synced: {data.stats.syncedOrders} | 
            Line Items: {data.stats.syncedLineItems} | 
            Errors: {data.stats.errors}
          </p>
        </div>
      );
      router.refresh();
    } catch (error) {
      console.error('Error syncing orders:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync orders');
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
          Syncing All Orders...
        </>
      ) : (
        'Sync All Orders'
      )}
    </Button>
  );
} 