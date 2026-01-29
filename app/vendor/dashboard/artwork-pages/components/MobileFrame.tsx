"use client"

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface MobileFrameProps {
  children: ReactNode
  className?: string
  enabled?: boolean
}

export function MobileFrame({ children, className, enabled = true }: MobileFrameProps) {
  // If not enabled, just render children directly
  if (!enabled) {
    return <>{children}</>
  }

  return (
    <div className={cn("flex justify-center items-start py-8", className)}>
      {/* Phone Frame */}
      <div className="relative">
        {/* Phone Body - iPhone 14 Pro dimensions */}
        <div className="w-[393px] h-[852px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[55px] p-[14px] shadow-2xl relative overflow-hidden border border-gray-700">
          {/* Dynamic Island */}
          <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-[20px] z-20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-800 border border-gray-700" />
          </div>
          
          {/* Screen */}
          <div className="w-full h-full bg-gray-950 rounded-[41px] overflow-hidden relative">
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-[59px] z-10 flex items-end justify-between px-8 pb-2">
              <span className="text-sm font-semibold text-white">9:41</span>
              <div className="flex items-center gap-1.5">
                {/* Cellular Signal */}
                <div className="flex items-end gap-0.5 h-3">
                  <div className="w-1 h-1 bg-white rounded-sm" />
                  <div className="w-1 h-1.5 bg-white rounded-sm" />
                  <div className="w-1 h-2 bg-white rounded-sm" />
                  <div className="w-1 h-3 bg-white rounded-sm" />
                </div>
                {/* WiFi */}
                <svg className="w-4 h-3 text-white" viewBox="0 0 16 12" fill="currentColor">
                  <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-4-3a1 1 0 011.414 0A4.978 4.978 0 008 5.5c1.38 0 2.632.56 3.536 1.464a1 1 0 11-1.414 1.414A2.99 2.99 0 008 7.5a2.99 2.99 0 00-2.122.878A1 1 0 014.464 6.5zM2.05 4.05a1 1 0 011.414 0A7.969 7.969 0 018 2.5c1.657 0 3.157.672 4.243 1.757a1 1 0 01-1.414 1.414A5.978 5.978 0 008 4.5a5.978 5.978 0 00-4.243 1.757 1 1 0 01-1.414-1.414A7.969 7.969 0 012.05 4.05z"/>
                </svg>
                {/* Battery */}
                <div className="w-[27px] h-[13px] border-2 border-white rounded-[4px] relative">
                  <div className="absolute inset-[2px] bg-white rounded-[1px]" style={{ width: "80%" }} />
                  <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[5px] bg-white rounded-r" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="w-full h-full overflow-y-auto scrollbar-hide">
              {children}
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-white/80 rounded-full" />
          </div>

          {/* Side Buttons - more realistic */}
          {/* Silent Switch */}
          <div className="absolute -left-[3px] top-[100px] w-[3px] h-[24px] bg-gray-600 rounded-l-sm" />
          {/* Volume Up */}
          <div className="absolute -left-[3px] top-[145px] w-[3px] h-[40px] bg-gray-600 rounded-l-sm" />
          {/* Volume Down */}
          <div className="absolute -left-[3px] top-[195px] w-[3px] h-[40px] bg-gray-600 rounded-l-sm" />
          {/* Power Button */}
          <div className="absolute -right-[3px] top-[160px] w-[3px] h-[70px] bg-gray-600 rounded-r-sm" />
        </div>

        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-[55px] bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none" />
      </div>
    </div>
  )
}
