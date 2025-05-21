import { format } from "date-fns"

export function formatDate(dateString: string | null | undefined, formatString: string = "MMMM d, yyyy"): string {
  if (!dateString) return "N/A"
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "Invalid Date"
    }
    return format(date, formatString)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
} 