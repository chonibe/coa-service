import { redirect } from "next/navigation"

/**
 * /vendor/studio/media/upload
 *
 * The inline upload affordance now lives on /vendor/studio/media itself
 * (hidden file input + progress rail). Any stale deep link or bookmark
 * to this page redirects to the canonical media surface so artists are
 * never bounced into the v1 media library.
 */
export default function VendorStudioMediaUploadRedirect() {
  redirect("/vendor/studio/media")
}
