/**
 * Attribute Type Validators
 * Validates and processes values for advanced attribute types
 */

export interface LocationValue {
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface CurrencyValue {
  currency_value: number
  currency_code: string // ISO 4217 code (USD, EUR, etc.)
}

export interface RatingValue {
  rating: number
  max_rating?: number // Default: 5
}

export interface TimestampValue {
  timestamp: string // ISO 8601
  timezone?: string // IANA timezone (e.g., "America/Los_Angeles")
}

export interface InteractionValue {
  interaction_type: string // 'email', 'call', 'meeting', etc.
  interacted_at: string // ISO 8601
  owner_actor?: {
    id: string
    type: 'user' | 'system' | 'api'
  }
}

export interface ActorReferenceValue {
  id: string
  type: 'user' | 'system' | 'api'
}

export interface PersonalNameValue {
  first_name?: string
  last_name?: string
  full_name?: string
  prefix?: string // 'Mr.', 'Mrs.', 'Dr.', etc.
  suffix?: string // 'Jr.', 'Sr.', 'III', etc.
}

/**
 * Validates a location value
 */
export function validateLocation(value: any): { valid: boolean; error?: string } {
  if (typeof value !== 'object' || value === null) {
    return { valid: false, error: 'Location must be an object' }
  }

  const location = value as Partial<LocationValue>
  
  // At least one of address, city, or country should be present
  if (!location.address && !location.city && !location.country) {
    return { valid: false, error: 'Location must have at least address, city, or country' }
  }

  // Validate coordinates if present
  if (location.coordinates) {
    if (typeof location.coordinates.lat !== 'number' || typeof location.coordinates.lng !== 'number') {
      return { valid: false, error: 'Coordinates must have numeric lat and lng' }
    }
    if (location.coordinates.lat < -90 || location.coordinates.lat > 90) {
      return { valid: false, error: 'Latitude must be between -90 and 90' }
    }
    if (location.coordinates.lng < -180 || location.coordinates.lng > 180) {
      return { valid: false, error: 'Longitude must be between -180 and 180' }
    }
  }

  return { valid: true }
}

/**
 * Validates a currency value
 */
export function validateCurrency(value: any): { valid: boolean; error?: string } {
  if (typeof value !== 'object' || value === null) {
    return { valid: false, error: 'Currency must be an object' }
  }

  const currency = value as Partial<CurrencyValue>

  if (typeof currency.currency_value !== 'number') {
    return { valid: false, error: 'currency_value must be a number' }
  }

  if (typeof currency.currency_code !== 'string' || currency.currency_code.length !== 3) {
    return { valid: false, error: 'currency_code must be a 3-character ISO 4217 code' }
  }

  return { valid: true }
}

/**
 * Validates a rating value
 */
export function validateRating(value: any): { valid: boolean; error?: string } {
  if (typeof value !== 'object' || value === null) {
    return { valid: false, error: 'Rating must be an object' }
  }

  const rating = value as Partial<RatingValue>

  if (typeof rating.rating !== 'number') {
    return { valid: false, error: 'rating must be a number' }
  }

  const maxRating = rating.max_rating || 5
  if (rating.rating < 0 || rating.rating > maxRating) {
    return { valid: false, error: `rating must be between 0 and ${maxRating}` }
  }

  return { valid: true }
}

/**
 * Validates a timestamp value
 */
export function validateTimestamp(value: any): { valid: boolean; error?: string } {
  if (typeof value !== 'object' || value === null) {
    return { valid: false, error: 'Timestamp must be an object' }
  }

  const timestamp = value as Partial<TimestampValue>

  if (typeof timestamp.timestamp !== 'string') {
    return { valid: false, error: 'timestamp must be an ISO 8601 string' }
  }

  // Try to parse the timestamp
  const date = new Date(timestamp.timestamp)
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'timestamp must be a valid ISO 8601 date string' }
  }

  return { valid: true }
}

/**
 * Validates an interaction value
 */
export function validateInteraction(value: any): { valid: boolean; error?: string } {
  if (typeof value !== 'object' || value === null) {
    return { valid: false, error: 'Interaction must be an object' }
  }

  const interaction = value as Partial<InteractionValue>

  if (typeof interaction.interaction_type !== 'string') {
    return { valid: false, error: 'interaction_type must be a string' }
  }

  if (typeof interaction.interacted_at !== 'string') {
    return { valid: false, error: 'interacted_at must be an ISO 8601 string' }
  }

  const date = new Date(interaction.interacted_at)
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'interacted_at must be a valid ISO 8601 date string' }
  }

  if (interaction.owner_actor) {
    if (typeof interaction.owner_actor.id !== 'string' || typeof interaction.owner_actor.type !== 'string') {
      return { valid: false, error: 'owner_actor must have id and type' }
    }
  }

  return { valid: true }
}

/**
 * Validates an actor reference value
 */
export function validateActorReference(value: any): { valid: boolean; error?: string } {
  if (typeof value !== 'object' || value === null) {
    return { valid: false, error: 'Actor reference must be an object' }
  }

  const actor = value as Partial<ActorReferenceValue>

  if (typeof actor.id !== 'string') {
    return { valid: false, error: 'id must be a string (UUID)' }
  }

  if (!['user', 'system', 'api'].includes(actor.type || '')) {
    return { valid: false, error: 'type must be one of: user, system, api' }
  }

  return { valid: true }
}

/**
 * Validates a personal name value
 */
export function validatePersonalName(value: any): { valid: boolean; error?: string } {
  if (typeof value !== 'object' || value === null) {
    return { valid: false, error: 'Personal name must be an object' }
  }

  const name = value as Partial<PersonalNameValue>

  // At least one of first_name, last_name, or full_name should be present
  if (!name.first_name && !name.last_name && !name.full_name) {
    return { valid: false, error: 'Personal name must have at least first_name, last_name, or full_name' }
  }

  return { valid: true }
}

/**
 * Validates a value based on its field type
 */
export function validateAttributeValue(fieldType: string, value: any): { valid: boolean; error?: string } {
  switch (fieldType) {
    case 'location':
      return validateLocation(value)
    case 'currency':
      return validateCurrency(value)
    case 'rating':
      return validateRating(value)
    case 'timestamp':
      return validateTimestamp(value)
    case 'interaction':
      return validateInteraction(value)
    case 'actor_reference':
      return validateActorReference(value)
    case 'personal_name':
      return validatePersonalName(value)
    default:
      // For other types, just check that value is not null
      return { valid: value !== null && value !== undefined }
  }
}

/**
 * Formats a value for display based on its field type
 */
export function formatAttributeValueForDisplay(fieldType: string, value: any): string {
  if (value === null || value === undefined) {
    return 'N/A'
  }

  switch (fieldType) {
    case 'location': {
      const loc = value as LocationValue
      const parts = []
      if (loc.city) parts.push(loc.city)
      if (loc.state) parts.push(loc.state)
      if (loc.country) parts.push(loc.country)
      return parts.length > 0 ? parts.join(', ') : loc.address || 'N/A'
    }

    case 'currency': {
      const curr = value as CurrencyValue
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: curr.currency_code,
      }).format(curr.currency_value)
    }

    case 'rating': {
      const rating = value as RatingValue
      const max = rating.max_rating || 5
      return `${rating.rating}/${max}`
    }

    case 'timestamp': {
      const ts = value as TimestampValue
      return new Date(ts.timestamp).toLocaleString()
    }

    case 'interaction': {
      const interaction = value as InteractionValue
      const date = new Date(interaction.interacted_at).toLocaleDateString()
      return `${interaction.interaction_type} on ${date}`
    }

    case 'actor_reference': {
      const actor = value as ActorReferenceValue
      return `${actor.type}: ${actor.id}`
    }

    case 'personal_name': {
      const name = value as PersonalNameValue
      if (name.full_name) return name.full_name
      const parts = [name.prefix, name.first_name, name.last_name, name.suffix].filter(Boolean)
      return parts.join(' ') || 'N/A'
    }

    default:
      return String(value)
  }
}

