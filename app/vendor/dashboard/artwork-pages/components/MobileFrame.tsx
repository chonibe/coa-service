"use client"

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface MobileFrameProps {
  children: ReactNode
  className?: string
}

export function MobileFrame({ children, className }: MobileFrameProps) {
  return (
    <div className={cn("flex justify-center items-start py-8", className)}>
      {/* Phone Frame */}
      <div className="relative">
        {/* Phone Body */}
        <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl relative overflow-hidden">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-20" />
          
          {/* Screen */}
          <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-11 bg-background z-10 flex items-center justify-between px-8 pt-safe">
              <span className="text-xs font-semibold">9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-3 border border-foreground rounded-sm relative">
                  <div className="absolute inset-0.5 bg-foreground rounded-[1px]" style={{ width: "80%" }} />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="w-full h-full overflow-y-auto scrollbar-hide pb-safe">
              {children}
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-foreground/30 rounded-full" />
          </div>

          {/* Side Buttons */}
          <div className="absolute -left-1 top-24 w-1 h-8 bg-gray-800 rounded-l" />
          <div className="absolute -left-1 top-36 w-1 h-12 bg-gray-800 rounded-l" />
          <div className="absolute -right-1 top-28 w-1 h-16 bg-gray-800 rounded-r" />
        </div>

        {/* Shadow/Glow Effect */}
        <div className="absolute inset-0 rounded-[3rem] shadow-xl pointer-events-none" />
      </div>
    </div>
  )
}
