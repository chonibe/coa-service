/**
 * Unified Design System Configuration
 * 
 * This file defines the unified design system tokens and utilities
 * that are automatically applied throughout the application.
 * 
 * All UI components inherit these styles by default, ensuring
 * consistency without needing to manually add classes.
 */

export const designSystem = {
  // Glassmorphism styles
  glassmorphism: {
    card: "bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl",
    cardSubtle: "bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/20",
    container: "bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm",
    hover: "hover:bg-slate-50/80 dark:hover:bg-slate-900/50 backdrop-blur-sm",
  },

  // Gradient styles
  gradients: {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
    text: "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent",
    success: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
    purple: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
  },

  // Button variants (automatically applied via button.tsx)
  buttons: {
    default: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg",
    outline: "border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-900/90",
    ghost: "hover:bg-slate-100/80 dark:hover:bg-slate-900/50 backdrop-blur-sm",
  },

  // Chart colors
  charts: {
    primary: "#3b82f6", // blue-500
    secondary: "#6366f1", // indigo-500
    accent: "#8b5cf6", // purple-500
    colors: ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e"],
  },

  // Shadows
  shadows: {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  },

  // Transitions
  transitions: {
    default: "transition-colors",
    all: "transition-all",
    fast: "transition-all duration-150",
    normal: "transition-all duration-200",
    slow: "transition-all duration-300",
  },
} as const

/**
 * Helper function to get glassmorphism classes
 */
export function getGlassmorphism(variant: "card" | "cardSubtle" | "container" | "hover" = "card") {
  return designSystem.glassmorphism[variant]
}

/**
 * Helper function to get gradient classes
 */
export function getGradient(variant: "primary" | "text" | "success" | "purple" = "primary") {
  return designSystem.gradients[variant]
}

/**
 * Helper function to get chart color
 */
export function getChartColor(index: number = 0) {
  return designSystem.charts.colors[index % designSystem.charts.colors.length]
}

