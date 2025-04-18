"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useArtistMessages } from "@/hooks/use-artist-messages"

interface ArtistMessageProps {
  isOpen: boolean
  onClose: () => void
  artistId: string
  certificateId: string
  collectorId: string
}

export function ArtistMessage({ isOpen, onClose, artistId, certificateId, collectorId }: ArtistMessageProps) {
  const { messages, sendMessage, markAsRead } = useArtistMessages(artistId, certificateId, collectorId)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)

  // Mark messages as read when opened
  useEffect(() => {
    if (isOpen && messages.some((m) => !m.readAt)) {
      markAsRead()
    }
  }, [isOpen, messages, markAsRead])

  const handleSendReply = async () => {
    if (!reply.trim()) return

    setSending(true)
    try {
      await sendMessage(reply)
      setReply("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  // Display proper name for each participant
  const getName = (senderId: string) => {
    return senderId === artistId ? "Chanchal Banga" : "You"
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/creative-portrait.png" alt="Chanchal Banga" />
              <AvatarFallback>CB</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">Chanchal Banga</h3>
              <p className="text-sm text-gray-500">
                Conversation about <em>Chromatic Flow #42</em>
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto p-2 -mx-2 my-4 border-y">
          {messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.senderId === collectorId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-lg ${
                      message.senderId === collectorId ? "bg-blue-100 text-gray-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">{getName(message.senderId)}</div>
                    <div>{message.content}</div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {new Date(message.sentAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">No messages yet</div>
          )}
        </div>

        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Write a reply..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="flex-grow min-h-[60px]"
          />
          <Button onClick={handleSendReply} disabled={!reply.trim() || sending} className="mb-1">
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="text-xs text-gray-500">Direct communication with the artist</div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
