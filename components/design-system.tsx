"use client"

import type * as React from "react"

interface DesignSystemProps {
  children: React.ReactNode
}

export function DesignSystem({ children }: DesignSystemProps) {
  return <>{children}</>
}
