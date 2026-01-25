"use client";

import React from "react";

export interface ToasterProps {
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  className?: string;
}

export const Toaster = React.forwardRef<HTMLDivElement, ToasterProps>(
  ({ position = "top-right", className = "" }, ref) => {
    // Placeholder toaster component - can be enhanced with actual toast functionality
    return (
      <div
        ref={ref}
        className={`fixed z-50 ${className}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Toast notifications will be rendered here */}
      </div>
    );
  }
);

Toaster.displayName = "Toaster";

// Toast utility functions
export const toast = {
  success: (message: string) => console.log("Toast:", message),
  error: (message: string) => console.error("Toast:", message),
  info: (message: string) => console.info("Toast:", message),
  warning: (message: string) => console.warn("Toast:", message),
};
