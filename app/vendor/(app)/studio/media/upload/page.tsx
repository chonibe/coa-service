"use client"

import MediaLibraryPage from "@/app/vendor/dashboard/media-library/page"

/**
 * /vendor/studio/media/upload — AppShell-native media uploader.
 * Re-renders the legacy media library component inside the AppShell shell so
 * we never route outside /vendor/(app). The legacy /vendor/dashboard/media-library
 * route is now a server-side redirect to /vendor/studio/media.
 *
 * TODO: relocate the media library component to components/vendor/media-library
 * as part of the Phase 1.5 cleanup pass (see docs/COMMIT_LOGS/v1-retirement-*).
 */
export default function MediaUploadPage() {
  return <MediaLibraryPage />
}
