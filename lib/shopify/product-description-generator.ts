/**
 * Generates a formatted product description HTML based on product data and vendor info
 */

interface ProductDescriptionData {
  title: string
  vendorName: string
  editionSize?: string | number | null // Format: "1/44"
  seriesSize?: string | number | null // Format: "1/2"
  releaseDate?: string | null // ISO date string or formatted date
  vendorBio?: string | null
  instagramUrl?: string | null
  existingDescription?: string | null
}

export function generateProductDescription(data: ProductDescriptionData): string {
  const {
    title,
    vendorName,
    editionSize,
    seriesSize,
    releaseDate,
    vendorBio,
    instagramUrl,
    existingDescription,
  } = data

  // Format edition size (e.g., "1/44" or just "44")
  let editionSizeText = ""
  if (editionSize) {
    if (typeof editionSize === "string" && editionSize.includes("/")) {
      editionSizeText = editionSize
    } else {
      // If just a number, assume it's the total and current edition is 1
      editionSizeText = `1/${editionSize}`
    }
  } else {
    editionSizeText = "1/?"
  }

  // Format series size (e.g., "1/2")
  let seriesSizeText = ""
  if (seriesSize) {
    if (typeof seriesSize === "string" && seriesSize.includes("/")) {
      seriesSizeText = seriesSize
    } else {
      seriesSizeText = `1/${seriesSize}`
    }
  } else {
    seriesSizeText = "1/?"
  }

  // Format release date
  let releaseDateText = ""
  if (releaseDate) {
    try {
      const date = new Date(releaseDate)
      releaseDateText = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      releaseDateText = releaseDate
    }
  } else {
    // Default to current date if not provided
    releaseDateText = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Extract Instagram username from URL for display
  let instagramHandle = ""
  let instagramLink = ""
  if (instagramUrl) {
    instagramLink = instagramUrl
    // Extract username from various Instagram URL formats
    const urlMatch = instagramUrl.match(/(?:instagram\.com\/|@)([a-zA-Z0-9._]+)/)
    if (urlMatch && urlMatch[1]) {
      instagramHandle = `@${urlMatch[1]}`
    } else {
      instagramHandle = instagramUrl
    }
  } else {
    instagramHandle = vendorName
  }

  // Build the HTML description
  let html = `<p>"${title}" - by ${vendorName}</p>

<p>EDITION SIZE: ${editionSizeText}</p>

<p>SERIES SIZE: ${seriesSizeText}</p>

<p>RELEASE DATE: ${releaseDateText}</p>

<p> </p>

<p><strong> *Artwork Prints are sold separately from The Street Lamp.</strong></p>

<p><strong>* La obra se adquiere por separado de la lámpara.</strong></p>

<p> </p>`

  // Add artist bio section if available
  if (vendorBio || instagramUrl) {
    html += `<p><span>`
    if (instagramUrl && vendorBio) {
      html += `<a href="${instagramLink}" rel="noopener noreferrer" target="_blank">${instagramHandle}</a> is ${vendorBio}`
    } else if (instagramUrl) {
      html += `<a href="${instagramLink}" rel="noopener noreferrer" target="_blank">${instagramHandle}</a>`
    } else if (vendorBio) {
      html += `${vendorName} is ${vendorBio}`
    }
    html += `</span></p>

<p> </p>

<p> </p>`
  }

  // Add standard sections
  html += `<h3><span>The Print</span></h3>

<p> </p>

<p><span>Our prints are crafted on premium 2mm polycarbonate vinyl, utilizing state-of-the-art high-definition printing technologies. These vinyls are effortlessly interchangeable, allowing you to collect and display multiple designs with ease..</span><strong></strong></p>

<p>Prints are sold separately from The Street Lamp.</p>

<p><span> </span></p>

<p> </p>

<h3><span>Buy a Print Support an Artist</span></h3>

<p> </p>

<p><span>Each Lamp Print is meticulously curated from talented artists, with a portion of the proceeds directly benefiting them. Your purchase not only brings a unique story into your home but also supports the local art community.</span></p>

<h3>Certificate of Authenticity</h3>

<p><span>Every print is accompanied by a digital limited edition Certificate of Authenticity. This certificate will be sent to your email, attached to your personal membership area, and permanently recorded on the Street Collector Ledger, ensuring the lasting provenance and value of your artwork.</span></p>

<ul></ul>

<p> </p>`

  // Append existing description if provided
  if (existingDescription && existingDescription.trim()) {
    html += `\n\n${existingDescription}`
  }

  return html
}

/**
 * Extracts edition size from product metafields
 */
export function extractEditionSize(metafields: any[]): string | null {
  if (!metafields || !Array.isArray(metafields)) return null

  const editionMetafield = metafields.find(
    (m: any) =>
      (m.key?.toLowerCase() === "edition_size" ||
        m.key?.toLowerCase() === "edition size" ||
        m.key?.toLowerCase() === "limited_edition_size" ||
        m.key?.toLowerCase() === "total_edition") &&
      m.value,
  )

  return editionMetafield?.value || null
}

/**
 * Extracts series size from product metafields
 */
export function extractSeriesSize(metafields: any[]): string | null {
  if (!metafields || !Array.isArray(metafields)) return null

  const seriesMetafield = metafields.find(
    (m: any) =>
      (m.key?.toLowerCase() === "series_size" ||
        m.key?.toLowerCase() === "series size" ||
        m.key?.toLowerCase() === "total_series") &&
      m.value,
  )

  return seriesMetafield?.value || null
}

/**
 * Extracts release date from product metafields
 */
export function extractReleaseDate(metafields: any[]): string | null {
  if (!metafields || !Array.isArray(metafields)) return null

  const dateMetafield = metafields.find(
    (m: any) =>
      (m.key?.toLowerCase() === "release_date" ||
        m.key?.toLowerCase() === "release date" ||
        m.key?.toLowerCase() === "launch_date") &&
      m.value,
  )

  return dateMetafield?.value || null
}

