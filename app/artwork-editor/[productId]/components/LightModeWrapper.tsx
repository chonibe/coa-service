"use client"

import { ReactNode } from "react"

export function LightModeWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="light bg-white min-h-screen">
      <style jsx global>{`
        html, body {
          background: white !important;
          color: rgb(17, 24, 39) !important;
        }
        * {
          color-scheme: light !important;
        }
        
        /* Override dark mode component styles */
        .bg-gray-700,
        .bg-gray-800,
        .bg-gray-900,
        .bg-gray-950 {
          background-color: rgb(249, 250, 251) !important; /* gray-50 */
        }
        
        .text-white {
          color: rgb(17, 24, 39) !important; /* gray-900 */
        }
        
        .text-gray-300,
        .text-gray-400 {
          color: rgb(107, 114, 128) !important; /* gray-500 */
        }
        
        .border-gray-600,
        .border-gray-700,
        .border-gray-800 {
          border-color: rgb(229, 231, 235) !important; /* gray-200 */
        }
        
        /* Fix specific dark backgrounds */
        .bg-blue-900\/20,
        .from-purple-900\/20,
        .to-gray-800 {
          background-color: rgb(239, 246, 255) !important; /* blue-50 */
        }
        
        .bg-gradient-to-br {
          background: rgb(239, 246, 255) !important;
        }
        
        /* Fix text in inputs and textareas */
        input, textarea {
          background-color: rgb(249, 250, 251) !important; /* gray-50 */
          color: rgb(17, 24, 39) !important; /* gray-900 */
          border-color: rgb(209, 213, 219) !important; /* gray-300 */
        }
        
        input::placeholder,
        textarea::placeholder {
          color: rgb(156, 163, 175) !important; /* gray-400 */
        }
      `}</style>
      {children}
    </div>
  )
}
