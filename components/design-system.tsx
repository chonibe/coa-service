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

          /* Apple blue */
          --primary: 0 122 255;
          --primary-foreground: 255 255 255;

          --secondary: 242 242 247;
          --secondary-foreground: 0 0 0;

          --muted: 249 249 249;
          --muted-foreground: 142 142 147;

          --accent: 242 242 247;
          --accent-foreground: 0 0 0;

          --destructive: 255 59 48;
          --destructive-foreground: 255 255 255;

          --border: 229 229 234;
          --input: 229 229 234;
          --ring: 0 122 255;

          --radius: 1rem;
        }

        .dark {
          --background: 0 0 0;
          --foreground: 255 255 255;

          --card: 28 28 30;
          --card-foreground: 255 255 255;

          --popover: 28 28 30;
          --popover-foreground: 255 255 255;

          /* Apple blue */
          --primary: 10 132 255;
          --primary-foreground: 255 255 255;

          --secondary: 44 44 46;
          --secondary-foreground: 255 255 255;

          --muted: 39 39 41;
          --muted-foreground: 142 142 147;

          --accent: 44 44 46;
          --accent-foreground: 255 255 255;

          --destructive: 255 69 58;
          --destructive-foreground: 255 255 255;

          --border: 44 44 46;
          --input: 44 44 46;
          --ring: 10 132 255;
        }

        /* Apple-like smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Apple-like font rendering */
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          @apply bg-background text-foreground transition-colors duration-300;
          font-feature-settings: "cv02", "cv03", "cv04", "cv11";
          font-family: -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", sans-serif;
        }

        /* Apple-like focus styles */
        :focus {
          outline: none;
        }

        :focus-visible {
          outline: 2px solid rgb(var(--primary));
          outline-offset: 2px;
        }

        /* Apple-like selection styles */
        ::selection {
          background-color: rgba(var(--primary), 0.2);
        }

        /* Smooth transitions for all interactive elements */
        a, button, input, select, textarea {
          transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* Apple-like scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(142, 142, 147, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(142, 142, 147, 0.5);
        }

        /* Disable tap highlight on mobile */
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
      {children}
    </div>
  )
}
