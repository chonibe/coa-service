/**
 * Build a customer-facing tracking URL for common last-mile carriers.
 * Falls back to STONE3PL web track when the carrier is unknown (matches public track page behavior).
 */

const STONE3PL_TRACK = 'https://stone3pl.com/?route=services/track&nums='

export function getCarrierTrackingPageUrl(
  carrier: string | null | undefined,
  trackingNumber: string,
): string {
  const tn = trackingNumber.trim()
  if (!tn) {
    return ''
  }

  const c = (carrier || '').toLowerCase().replace(/\s+/g, ' ')

  if (c.includes('usps') || c.includes('u.s. postal')) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tn)}`
  }
  if (c.includes('ups') && !c.includes('pickup')) {
    return `https://www.ups.com/track?tracknum=${encodeURIComponent(tn)}`
  }
  if (c.includes('fedex') || c.includes('fed ex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tn)}`
  }
  if (c.includes('dhl')) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(tn)}&brand=DHL`
  }
  if (c.includes('amazon')) {
    return `https://www.amazon.com/progress-tracker/package/ref=pt_redirect_tracking_id?trackingId=${encodeURIComponent(tn)}`
  }
  if (c.includes('ontrac')) {
    return `https://www.ontrac.com/tracking/?number=${encodeURIComponent(tn)}`
  }
  if (c.includes('lasership') || c.includes('laser ship')) {
    return `https://www.lasership.com/track.php?track_number_input=${encodeURIComponent(tn)}`
  }
  if (c.includes('purolator')) {
    return `https://www.purolator.com/purolator/ship-track/tracking-details.page?pin=${encodeURIComponent(tn)}`
  }
  if (c.includes('canada post') || c.includes('canadapost')) {
    return `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${encodeURIComponent(tn)}`
  }
  if (c.includes('royal mail')) {
    return `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(tn)}`
  }
  if (c.includes('australia post') || c.includes('auspost')) {
    return `https://auspost.com.au/mypost/track/#/details/${encodeURIComponent(tn)}`
  }

  return `${STONE3PL_TRACK}${encodeURIComponent(tn)}`
}
