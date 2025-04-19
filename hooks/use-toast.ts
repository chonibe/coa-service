"use client"

import * as React from "react"

import { Toaster as RadixToaster } from "@/components/ui/toast"

const ToastContext = React.createContext<{
  addToast: (toast: Toast) => void
  updateToast: (id: string, toast: Partial<Toast>) => void
  dismissToast: (id: string) => void
}>(null as any)

interface Toast {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  duration?: number
  variant?: "default" | "destructive"
}

interface ToastProviderProps {
  children: React.ReactNode
}

function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = (toast: Toast) => {
    setToasts((prevToasts) => [...prevToasts, toast])
  }

  const updateToast = (id: string, toast: Partial<Toast>) => {
    setToasts((prevToasts) => prevToasts.map((t) => (t.id === id ? { ...t, ...toast } : t)))
  }

  const dismissToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ addToast, updateToast, dismissToast }}>
      {children}
      <RadixToaster
        open={toasts.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setToasts([])
          }
        }}
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </ToastContext.Provider>
  )
}

function useToast() {
  const { addToast, updateToast, dismissToast } = React.useContext(ToastContext)

  return {
    toast: ({ title, description, action, variant, duration = 5000 }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9)
      addToast({ id, title, description, action, variant, duration })

      return {
        id,
        update: (props: Partial<Omit<Toast, "id">>) => updateToast(id, props),
        dismiss: () => dismissToast(id),
      }
    },
    dismiss: dismissToast,
  }
}

export { ToastProvider, useToast, type Toast }
export const toast = useToast
