import { redirect } from "next/navigation"

/**
 * Root route (/) — Default landing for app.thestreetcollector.com
 * Redirects to the Street Collector shop homepage.
 */
export default function HomePage() {
  redirect("/shop/street-collector")
}
