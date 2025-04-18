"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"

interface Response {
  id: string
  content: string
  sentAt: Date
  artistName: string
  artworkTitle: string
  collectorName: string
}

interface CollectorResponsesProps {
  responses: Response[]
  isOpen: boolean
  onClose: () => void
}

export function CollectorResponses({ responses, isOpen, onClose }: CollectorResponsesProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Conversations with Artists</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 py-2">
            {responses.length > 0 ? (
              responses.map((response) => (
                <div key={response.id} className="border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{response.artistName}</div>
                      <div className="text-sm text-gray-500">Re: {response.artworkTitle}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDistanceToNow(response.sentAt, { addSuffix: true })}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{response.content}</p>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-xs text-gray-500 mb-1">Your response:</div>
                    <p className="text-sm">{response.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No conversations yet</div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
