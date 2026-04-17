"use client"

import ProfileEditorPage from "@/app/vendor/dashboard/profile/page"

/**
 * /vendor/profile/edit — AppShell-native profile editor.
 *
 * Renders the full legacy profile editor inside the AppShell shell so the
 * collector-facing arc never routes through /vendor/dashboard. Hash fragments
 * (#contact, #payment, #tax, #account) are preserved by the browser and the
 * underlying editor scrolls into view via scroll-mt anchors.
 *
 * TODO (Phase 1.5 cleanup): relocate the editor to components/vendor/profile-editor
 * and split the 1800+ line file. Tracked in docs/COMMIT_LOGS/v1-retirement-*.
 */
export default function VendorProfileEditPage() {
  return <ProfileEditorPage />
}
