import { cookies as nextCookies } from "next/headers"

export const cookies = () => {
  return nextCookies()
}
