"use client";

import React from "react";

export interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  size?: "small" | "medium" | "large";
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, max = 100, className = "", size = "medium" }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    const heights = {
      small: "h-1",
      medium: "h-2",
      large: "h-3"
    };

    return (
      <div
        ref={ref}
        className={`relative w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${heights[size]} ${className}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";
