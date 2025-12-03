/**
 * Email Threading Utilities
 * Detects and organizes email threads based on headers and subject lines
 */

export interface EmailHeaders {
  'in-reply-to'?: string
  'references'?: string
  'message-id'?: string
  'subject'?: string
}

export interface ThreadedMessage {
  id: string
  message_id?: string
  in_reply_to?: string
  references?: string[]
  subject?: string
  created_at: string
  thread_id?: string
  parent_message_id?: string
  thread_depth: number
  thread_order: number
  children?: ThreadedMessage[]
}

/**
 * Normalize subject line for thread matching
 * Removes "Re:", "Fwd:", "Fw:" prefixes and whitespace
 */
export function normalizeSubject(subject: string): string {
  if (!subject) return ''
  
  return subject
    .trim()
    .replace(/^(re|fwd?|fw):\s*/i, '')
    .replace(/\[.*?\]/g, '') // Remove [tags]
    .trim()
    .toLowerCase()
}

/**
 * Extract message IDs from References header
 */
export function parseReferences(references: string): string[] {
  if (!references) return []
  
  // References header contains space-separated message IDs in angle brackets
  const matches = references.match(/<[^>]+>/g)
  return matches ? matches.map(id => id.slice(1, -1)) : []
}

/**
 * Extract message ID from In-Reply-To header
 */
export function parseInReplyTo(inReplyTo: string): string | null {
  if (!inReplyTo) return null
  
  // In-Reply-To header contains message ID in angle brackets
  const match = inReplyTo.match(/<([^>]+)>/)
  return match ? match[1] : null
}

/**
 * Detect thread relationships from email headers
 */
export function detectThreadParent(
  message: ThreadedMessage,
  allMessages: ThreadedMessage[]
): string | null {
  // Method 1: Use In-Reply-To header (most reliable)
  if (message.in_reply_to) {
    const parent = allMessages.find(
      m => m.message_id === message.in_reply_to
    )
    if (parent) {
      return parent.id
    }
  }

  // Method 2: Use References header (fallback)
  if (message.references && message.references.length > 0) {
    // The last reference is usually the immediate parent
    const lastReference = message.references[message.references.length - 1]
    const parent = allMessages.find(m => m.message_id === lastReference)
    if (parent) {
      return parent.id
    }
  }

  // Method 3: Match by normalized subject (less reliable)
  if (message.subject) {
    const normalizedSubject = normalizeSubject(message.subject)
    const sameSubjectMessages = allMessages.filter(
      m => m.subject && normalizeSubject(m.subject) === normalizedSubject
    )
    
    if (sameSubjectMessages.length > 0) {
      // Find the earliest message with same subject (likely the root)
      const rootMessage = sameSubjectMessages.reduce((earliest, current) => {
        return new Date(current.created_at) < new Date(earliest.created_at)
          ? current
          : earliest
      })
      
      // Only use as parent if this message is not the root
      if (rootMessage.id !== message.id) {
        return rootMessage.id
      }
    }
  }

  return null
}

/**
 * Organize messages into thread hierarchy
 */
export function organizeThreads(messages: ThreadedMessage[]): ThreadedMessage[] {
  // Create a map for quick lookup
  const messageMap = new Map<string, ThreadedMessage>()
  messages.forEach(msg => {
    messageMap.set(msg.id, { ...msg, children: [] })
  })

  // Build parent-child relationships
  const rootMessages: ThreadedMessage[] = []

  messages.forEach(msg => {
    const messageNode = messageMap.get(msg.id)!
    const parentId = detectThreadParent(msg, messages)

    if (parentId) {
      const parent = messageMap.get(parentId)
      if (parent) {
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(messageNode)
      } else {
        // Orphaned message (parent not found), treat as root
        rootMessages.push(messageNode)
      }
    } else {
      // Root message (no parent)
      rootMessages.push(messageNode)
    }
  })

  // Sort root messages by created_at
  rootMessages.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Sort children within each thread
  function sortChildren(node: ThreadedMessage) {
    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      node.children.forEach(sortChildren)
    }
  }

  rootMessages.forEach(sortChildren)

  return rootMessages
}

/**
 * Calculate thread depth for a message
 */
export function calculateThreadDepth(
  messageId: string,
  messages: ThreadedMessage[],
  depth: number = 0
): number {
  const message = messages.find(m => m.id === messageId)
  if (!message) return depth

  const parentId = detectThreadParent(message, messages)
  if (!parentId) return depth

  return calculateThreadDepth(parentId, messages, depth + 1)
}

/**
 * Get all messages in a thread (including nested children)
 */
export function getAllThreadMessages(
  rootMessage: ThreadedMessage,
  allMessages: ThreadedMessage[]
): ThreadedMessage[] {
  const threadMessages: ThreadedMessage[] = [rootMessage]

  function collectChildren(node: ThreadedMessage) {
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        threadMessages.push(child)
        collectChildren(child)
      })
    }
  }

  collectChildren(rootMessage)
  return threadMessages
}

/**
 * Find root message of a thread
 */
export function findThreadRoot(
  messageId: string,
  messages: ThreadedMessage[]
): ThreadedMessage | null {
  const message = messages.find(m => m.id === messageId)
  if (!message) return null

  const parentId = detectThreadParent(message, messages)
  if (!parentId) return message

  return findThreadRoot(parentId, messages)
}

