import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
