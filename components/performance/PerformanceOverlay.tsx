"use client"

import React, { useState, useEffect } from 'react'
import { Info } from 'lucide-react'

interface PerformanceOverlayProps {
  renderTime: number
  componentName: string
}

const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({ 
  renderTime, 
  componentName 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [renderDuration, setRenderDuration] = useState(0)

  useEffect(() => {
    const endRenderTime = performance.now()
    const duration = endRenderTime - renderTime
    setRenderDuration(duration)

    // Only show overlay if render time exceeds threshold
    setIsVisible(duration > 50)

    // Optional: Log performance metrics
    if (duration > 50) {
      console.warn(`Performance Alert: ${componentName} took ${duration.toFixed(2)}ms to render`)
    }
  }, [renderTime, componentName])

  if (!isVisible) return null

  return (
    <div 
      className="fixed top-4 right-4 z-[9999] bg-yellow-100 border border-yellow-300 p-3 rounded-lg shadow-lg flex items-center space-x-2"
      role="alert"
    >
      <Info className="w-5 h-5 text-yellow-600" />
      <div>
        <p className="text-xs font-semibold text-yellow-800">
          Performance Warning
        </p>
        <p className="text-xs text-yellow-700">
          {componentName} render: {renderDuration.toFixed(2)}ms
        </p>
      </div>
    </div>
  )
}

export default PerformanceOverlay 