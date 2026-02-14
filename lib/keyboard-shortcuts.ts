/**
 * Keyboard Shortcuts Handler for Vendor Portal
 * 
 * Provides keyboard navigation and shortcuts for power users
 */

export type ShortcutAction = 
  | "search"
  | "dashboard"
  | "products"
  | "analytics"
  | "payouts"
  | "messages"
  | "settings"
  | "help"
  | "shortcuts"

export interface KeyboardShortcut {
  key: string
  action: ShortcutAction
  description: string
  handler: () => void
}

export class KeyboardShortcutsManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private isEnabled: boolean = true
  private showHelp: boolean = false

  constructor() {
    if (typeof window !== "undefined") {
      this.setupEventListeners()
    }
  }

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut) {
    this.shortcuts.set(shortcut.key, shortcut)
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(key: string) {
    this.shortcuts.delete(key)
  }

  /**
   * Enable/disable shortcuts
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  /**
   * Show/hide shortcuts help
   */
  setShowHelp(show: boolean) {
    this.showHelp = show
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * Get shortcuts for help display
   */
  getShortcutsByCategory(): Record<string, KeyboardShortcut[]> {
    const categories: Record<string, KeyboardShortcut[]> = {
      navigation: [],
      actions: [],
    }

    this.shortcuts.forEach((shortcut) => {
      if (["dashboard", "products", "analytics", "payouts", "messages", "settings"].includes(shortcut.action)) {
        categories.navigation.push(shortcut)
      } else {
        categories.actions.push(shortcut)
      }
    })

    return categories
  }

  private setupEventListeners() {
    window.addEventListener("keydown", this.handleKeyDown.bind(this))
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.isContentEditable
    ) {
      return
    }

    if (!this.isEnabled) return

    // Handle '?' key to show shortcuts
    if (event.key === "?" && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault()
      this.setShowHelp(!this.showHelp)
      this.dispatchEvent("shortcuts-toggle", { show: this.showHelp })
      return
    }

    // Build key combination string
    const parts: string[] = []
    if (event.ctrlKey || event.metaKey) parts.push("mod")
    if (event.shiftKey) parts.push("shift")
    if (event.altKey) parts.push("alt")
    parts.push(event.key.toLowerCase())

    const keyCombo = parts.join("+")
    const shortcut = this.shortcuts.get(keyCombo)

    if (shortcut) {
      event.preventDefault()
      shortcut.handler()
    }
  }

  private dispatchEvent(eventName: string, detail: any) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(eventName, { detail }))
    }
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleKeyDown.bind(this))
    }
  }
}

// Default shortcuts configuration
export const defaultShortcuts: Omit<KeyboardShortcut, "handler">[] = [
  { key: "/", action: "search", description: "Focus search" },
  { key: "mod+k", action: "search", description: "Open command palette" },
  { key: "g+d", action: "dashboard", description: "Go to dashboard" },
  { key: "g+p", action: "products", description: "Go to products" },
  { key: "g+a", action: "analytics", description: "Go to analytics" },
  { key: "g+y", action: "payouts", description: "Go to payouts" },
  { key: "g+m", action: "messages", description: "Go to messages" },
  { key: "g+s", action: "settings", description: "Go to settings" },
  { key: "?", action: "shortcuts", description: "Show keyboard shortcuts" },
]

