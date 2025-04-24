"use client"

import type * as React from "react"

interface DesignSystemProps {
  children: React.ReactNode
}

export function DesignSystem({ children }: DesignSystemProps) {
  return (
    <div className="font-sans antialiased">
      {/* Global Styles */}
      <style jsx global>{`
       :root {
         --background: 255 255 255;
         --foreground: 0 0 0;

         --card: 255 255 255;
         --card-foreground: 0 0 0;

         --popover: 255 255 255;
         --popover-foreground: 0 0 0;

         --primary: 0 122 255; /* Apple primary color */
         --primary-foreground: 255 255 255;

         --secondary: 242 242 242;
         --secondary-foreground: 0 0 0;

         --muted: 247 250 252;
         --muted-foreground: 102 112 133;

         --accent: 247 250 252;
         --accent-foreground: 17 24 39;

         --destructive: 239 68 68;
         --destructive-foreground: 255 255 255;

         --border: 227 230 232;
         --input: 227 230 232;
         --ring: 0 122 255; /* Apple primary color */

         --radius: 0.5rem;

         /* System Colors */
         --system-background: 255 255 255;
         --secondary-system-background: 242 242 242;
         --tertiary-system-background: 247 250 252;
         --system-foreground: 0 0 0;
       }

       .dark {
         --background: 0 0 0;
         --foreground: 255 255 255;

         --card: 17 24 39;
         --card-foreground: 255 255 255;

         --popover: 17 24 39;
         --popover-foreground: 255 255 255;

         --primary: 0 122 255; /* Apple primary color */
         --primary-foreground: 255 255 255;

         --secondary: 45 55 72;
         --secondary-foreground: 255 255 255;

         --muted: 17 24 39;
         --muted-foreground: 156 163 175;

         --accent: 31 41 55;
         --accent-foreground: 255 255 255;

         --destructive: 239 68 68;
         --destructive-foreground: 255 255 255;

         --border: 45 55 72;
         --input: 45 55 72;
         --ring: 0 122 255; /* Apple primary color */

         /* System Colors */
         --system-background: 0 0 0;
         --secondary-system-background: 17 24 39;
         --tertiary-system-background: 31 41 55;
         --system-foreground: 255 255 255;
       }

       body {
         font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "San Francisco", Helvetica, Arial, sans-serif;
         @apply bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-50;
       }
     `}</style>
      {children}
    </div>
  )
}
