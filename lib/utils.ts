import { cookies as nextCookies } from "next/headers"

export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}

export const cookies = () => {
  return nextCookies()
}
