"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Package, Truck, CheckCircle, AlertTriangle, Clock, Send, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface OrderStatusNote {
  id: string;
  order_id: string;
  order_name: string | null;
  status_code: number | null;
  status_name: string | null;
  track_status_code: number | null;
  track_status_name: string | null;
  tracking_number: string | null;
  note: string;
  source: string;
  created_at: string;
}

interface OrderStatusHistoryProps {
  orderId: string;
  orderName?: string;
}

// Map track status codes to icons and colors
const getStatusIcon = (trackStatusCode: number | null, statusCode: number | null) => {
  // Check track status first
  if (trackStatusCode) {
    switch (trackStatusCode) {
      case 121: // Delivered
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' };
      case 112: // Out for Delivery
        return { icon: Truck, color: 'text-amber-500', bg: 'bg-amber-50' };
      case 101: // In Transit
      case 111: // Pick Up
        return { icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50' };
      case 131: // Alert
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' };
      default:
        return { icon: Package, color: 'text-gray-500', bg: 'bg-gray-50' };
    }
  }
  
  // Check warehouse status
  if (statusCode === 3) { // Shipped
    return { icon: Send, color: 'text-purple-500', bg: 'bg-purple-50' };
  }
  
  return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50' };
};

const getSourceBadge = (source: string) => {
  switch (source) {
    case 'auto':
      return <Badge variant="outline" className="text-xs">Auto</Badge>;
    case 'manual':
      return <Badge variant="secondary" className="text-xs">Manual</Badge>;
    case 'webhook':
      return <Badge variant="default" className="text-xs">Webhook</Badge>;
    default:
      return null;
  }
};

export default function OrderStatusHistory({ orderId, orderName }: OrderStatusHistoryProps) {
  const [notes, setNotes] = useState<OrderStatusNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [orderId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders/${orderId}/notes`);
      if (!res.ok) {
        throw new Error('Failed to fetch status history');
      }
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load status history');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          note: newNote.trim(),
          orderName: orderName 
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to add note');
      }
      
      toast.success('Note added successfully');
      setNewNote('');
      setShowAddNote(false);
      fetchNotes(); // Refresh notes
    } catch (err: any) {
      toast.error(err.message || 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className="mt-4 sm:mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-4 sm:mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 sm:mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status History
            {notes.length > 0 && (
              <Badge variant="secondary" className="ml-2">{notes.length}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddNote(!showAddNote)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent>
          {/* Add Note Form */}
          {showAddNote && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30">
              <Textarea
                placeholder="Add a manual note about this order..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="mb-3"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddNote(false);
                    setNewNote('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={submitting || !newNote.trim()}
                >
                  {submitting ? 'Adding...' : 'Add Note'}
                </Button>
              </div>
            </div>
          )}

          {/* Notes Timeline */}
          {notes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No status history yet. Updates will appear here as your order progresses.
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-4">
                {notes.map((note, index) => {
                  const { icon: Icon, color, bg } = getStatusIcon(note.track_status_code, note.status_code);
                  
                  return (
                    <div key={note.id} className="relative flex gap-4">
                      {/* Icon */}
                      <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{note.note}</p>
                            {note.tracking_number && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Tracking: <code className="bg-muted px-1 py-0.5 rounded">{note.tracking_number}</code>
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getSourceBadge(note.source)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {note.status_name && (
                            <Badge variant="outline" className="text-xs">
                              {note.status_name}
                            </Badge>
                          )}
                          {note.track_status_name && (
                            <Badge variant="secondary" className="text-xs">
                              {note.track_status_name}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(note.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
