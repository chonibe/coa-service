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
  return React.useContext(ToastContext)
}

export { ToastProvider, useToast }
