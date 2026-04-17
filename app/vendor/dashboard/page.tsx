import { redirect } from "next/navigation"

// The legacy dashboard landing page has been superseded by the app-shell home.
// Subroutes under /vendor/dashboard (products, messages, profile, etc.) still
// work and are reached from within the app shell until Phase 6 fully mounts
// them under the new chrome.
export default function LegacyVendorDashboardRedirect() {
  redirect("/vendor/home")
}
