export interface Artwork {
  id: string
  handle?: string
  title: string
  description: string
  price: number | null
  currency: string
  images: { src: string; alt: string; width: number; height: number }[]
  vendor: { name: string; bio?: string; profileImageUrl?: string }
  series?: {
    id: string
    name: string
    unlockType: string
    thumbnailUrl?: string
    description?: string
  }
  seriesMember?: {
    displayOrder: number
    isLocked: boolean
  }
  shopifyProductId: string
  submittedAt: string
  isNew: boolean
}

export interface MarketplaceApiResponse {
  success: boolean
  artworks: Artwork[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
  filters: {
    artist?: string
    series?: string
    minPrice?: number
    maxPrice?: number
    sortBy?: string
  }
  availableFilters: {
    artists: string[]
    series: string[]
    minPrice: number
    maxPrice: number
  }
}

export interface ProductArtwork {
  id: string
  title: string
  description: string
  handle?: string
  productType?: string
  tags: string[]
  images: { id: string; src: string; alt: string; width: number; height: number }[]
  variants: {
    id: string
    title: string
    sku: string | null
    price: number
    compareAtPrice: number | null
    available: boolean
    inventoryQuantity: number
    weight: number
    weightUnit: string
  }[]
  price: number | null
  compareAtPrice: number | null
  currency: string
  shopifyProductId: string
  vendor: {
    name: string
    bio?: string
    profileImageUrl?: string
    websiteUrl?: string
    instagramHandle?: string
  }
  series?: {
    id: string
    name: string
    unlockType: string
    unlockConfig: any
    thumbnailUrl?: string
    description?: string
    memberInfo?: {
      displayOrder: number
      isLocked: boolean
      unlockOrder: number
    }
  }
  relatedArtworks: {
    id: string
    title: string
    image?: string
    displayOrder: number
    isLocked: boolean
  }[]
  submittedAt: string
  isNew: boolean
}

export interface ProductApiResponse {
  success: boolean
  artwork: ProductArtwork
}

export interface SeriesArtwork {
  id: string
  handle?: string
  title: string
  description: string
  image?: string
  shopifyProductId: string
  displayOrder: number
  isLocked: boolean
  unlockOrder: number
  submittedAt: string
  isOwned: boolean
}

export interface CollectorSeries {
  id: string
  name: string
  description?: string
  thumbnailUrl?: string
  unlockType: string
  unlockConfig: any
  displayOrder: number
  isActive: boolean
  isPrivate: boolean
  teaserImageUrl?: string
  unlockMessage?: string
  vendor: {
    name: string
    bio?: string
    profileImageUrl?: string
  }
  artworks: SeriesArtwork[]
  createdAt: string
  updatedAt: string
}

export interface SeriesApiResponse {
  success: boolean
  series: CollectorSeries
}

export interface ArtistArtwork {
  id: string
  handle?: string
  title: string
  description: string
  price: number | null
  currency: string
  images: { src: string; alt: string; width: number; height: number }[]
  vendor: { name: string; bio?: string; profileImageUrl?: string }
  shopifyProductId: string
  submittedAt: string
  isNew: boolean
  series?: {
    id: string
    name: string
    unlockType: string
    thumbnailUrl?: string
    description?: string
  }
  seriesMember?: {
    displayOrder: number
    isLocked: boolean
  }
}

export interface ArtistSeries {
  id: string
  name: string
  description?: string
  thumbnailUrl?: string
  unlockType: string
  isActive: boolean
  isPrivate: boolean
  teaserImageUrl?: string
  totalPieces: number
  ownedPieces: number
  isUnlocked: boolean
}

export interface ArtistProfile {
  id: number
  name: string
  bio?: string
  profileImageUrl?: string
  websiteUrl?: string
  instagramHandle?: string
}

export interface ArtistApiResponse {
  success: boolean
  artist: ArtistProfile
  artworks: ArtistArtwork[]
  series: ArtistSeries[]
}

// Enhanced collector profile types

export interface CollectorEdition {
  id: number
  lineItemId: string
  productId: string | null
  name: string
  editionNumber: number | null
  editionTotal: number | null
  editionType: "limited" | "open" | null
  verificationSource: "supabase" | "sequential_uuid" | "sequential_order" | "order_sequence" | "random" | null
  imgUrl: string | null
  vendorName: string | null
  series?: {
    id: string
    name: string
    vendorName: string
  } | null
  purchaseDate: string
  price: number | null
  certificateUrl: string | null
}

export interface CollectorCertification {
  id: number
  lineItemId: string
  name: string
  vendorName: string | null
  seriesName: string | null
  nfcTagId: string | null
  nfcClaimedAt: string | null
  certificateUrl: string | null
  certificateToken: string | null
  status: "authenticated" | "pending" | "certificate_available" | "no_nfc"
  imgUrl: string | null
  purchaseDate: string
  editionNumber: number | null
  editionTotal: number | null
}

export interface HiddenContent {
  hiddenSeries: Array<{
    id: string
    name: string
    description?: string
    thumbnailUrl?: string | null
    teaserImageUrl?: string | null
    vendorName: string
    unlockedAt: string
    unlockedVia: {
      artworkId: string
      artworkName: string
      purchaseDate: string
    }
  }>
  bonusContent: Array<{
    id: number
    benefitType: string
    title: string
    description?: string
    contentUrl?: string
    accessCode?: string
    unlockedAt: string
    unlockedVia: {
      artworkId: string
      artworkName: string
      vendorName: string
      purchaseDate: string
    }
    expiresAt?: string | null
  }>
}

export interface ArtistCollectionStats {
  vendorName: string
  vendorId?: number
  totalArtworksOwned: number
  totalSeriesCollected: number
  seriesDetails: Array<{
    seriesId: string
    seriesName: string
    ownedCount: number
    totalPieces: number
    completionPercentage: number
    thumbnailUrl?: string | null
  }>
  hiddenSeriesUnlocked: number
  firstPurchaseDate: string | null
  lastPurchaseDate: string | null
  totalSpent: number
  completionRate: number
  recentPurchases: Array<{
    id: number
    name: string
    purchaseDate: string
    price: number | null
  }>
}