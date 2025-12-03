-- Migration: Additional Attribute Types
-- Adds support for Location, Currency, Rating, Timestamp, Interaction, Actor Reference, Personal Name
-- Date: 2025-12-04

-- ============================================
-- PART 1: Add attribute_type column (if not exists)
-- Note: field_type already exists, we'll use it for these new types
-- ============================================

-- The field_type column already supports these types:
-- 'location', 'currency', 'rating', 'timestamp', 'interaction', 'actor_reference', 'personal_name'

-- ============================================
-- PART 2: Helper function to validate attribute type values
-- ============================================

CREATE OR REPLACE FUNCTION validate_attribute_value(
  p_field_type TEXT,
  p_value JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate based on field type
  CASE p_field_type
    WHEN 'location' THEN
      -- Location: { address, city, state, country, postal_code, coordinates: { lat, lng } }
      RETURN (
        p_value ? 'address' OR p_value ? 'city' OR p_value ? 'country'
      );
    
    WHEN 'currency' THEN
      -- Currency: { currency_value: number, currency_code: string (ISO 4217) }
      RETURN (
        p_value ? 'currency_value' AND
        p_value ? 'currency_code' AND
        (p_value->>'currency_value')::NUMERIC IS NOT NULL
      );
    
    WHEN 'rating' THEN
      -- Rating: { rating: number (1-5 or custom range), max_rating?: number }
      RETURN (
        p_value ? 'rating' AND
        (p_value->>'rating')::NUMERIC IS NOT NULL
      );
    
    WHEN 'timestamp' THEN
      -- Timestamp: { timestamp: ISO 8601 string, timezone?: string }
      RETURN (
        p_value ? 'timestamp' AND
        (p_value->>'timestamp')::TIMESTAMP WITH TIME ZONE IS NOT NULL
      );
    
    WHEN 'interaction' THEN
      -- Interaction: { interaction_type: string, interacted_at: ISO 8601, owner_actor?: { id, type } }
      RETURN (
        p_value ? 'interaction_type' AND
        p_value ? 'interacted_at'
      );
    
    WHEN 'actor_reference' THEN
      -- Actor Reference: { id: UUID, type: 'user' | 'system' | 'api' }
      RETURN (
        p_value ? 'id' AND
        p_value ? 'type'
      );
    
    WHEN 'personal_name' THEN
      -- Personal Name: { first_name, last_name, full_name, prefix?, suffix? }
      RETURN (
        p_value ? 'first_name' OR p_value ? 'last_name' OR p_value ? 'full_name'
      );
    
    ELSE
      -- Unknown type, allow it (for backward compatibility)
      RETURN true;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: Helper function to format attribute value for display
-- ============================================

CREATE OR REPLACE FUNCTION format_attribute_value_for_display(
  p_field_type TEXT,
  p_value JSONB
)
RETURNS TEXT AS $$
BEGIN
  CASE p_field_type
    WHEN 'location' THEN
      -- Format: "City, State, Country" or "Address, City"
      RETURN COALESCE(
        p_value->>'city' || 
        CASE WHEN p_value->>'state' IS NOT NULL THEN ', ' || p_value->>'state' ELSE '' END ||
        CASE WHEN p_value->>'country' IS NOT NULL THEN ', ' || p_value->>'country' ELSE '' END,
        p_value->>'address'
      );
    
    WHEN 'currency' THEN
      -- Format: "$1,234.56 USD"
      RETURN COALESCE(
        '$' || TO_CHAR((p_value->>'currency_value')::NUMERIC, 'FM999,999,999.00') || ' ' || (p_value->>'currency_code'),
        'N/A'
      );
    
    WHEN 'rating' THEN
      -- Format: "4/5" or "4 stars"
      RETURN COALESCE(
        (p_value->>'rating') || 
        CASE 
          WHEN p_value->>'max_rating' IS NOT NULL THEN '/' || p_value->>'max_rating'
          ELSE '/5'
        END,
        'N/A'
      );
    
    WHEN 'timestamp' THEN
      -- Format: ISO 8601 timestamp
      RETURN p_value->>'timestamp';
    
    WHEN 'interaction' THEN
      -- Format: "Email on 2023-01-01"
      RETURN COALESCE(
        INITCAP(p_value->>'interaction_type') || ' on ' || 
        TO_CHAR((p_value->>'interacted_at')::TIMESTAMP WITH TIME ZONE, 'YYYY-MM-DD'),
        'N/A'
      );
    
    WHEN 'actor_reference' THEN
      -- Format: "User: John Doe" or "System"
      RETURN COALESCE(
        INITCAP(p_value->>'type') || 
        CASE WHEN p_value->>'id' IS NOT NULL THEN ': ' || p_value->>'id' ELSE '' END,
        'N/A'
      );
    
    WHEN 'personal_name' THEN
      -- Format: "John Doe" or "Dr. John Doe, Jr."
      RETURN COALESCE(
        p_value->>'full_name',
        TRIM(COALESCE(p_value->>'prefix', '') || ' ' || 
             COALESCE(p_value->>'first_name', '') || ' ' || 
             COALESCE(p_value->>'last_name', '') || ' ' || 
             COALESCE(p_value->>'suffix', ''))
      );
    
    ELSE
      -- Default: return JSON string
      RETURN p_value::TEXT;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 4: Comments for documentation
-- ============================================

COMMENT ON FUNCTION validate_attribute_value IS
'Validates attribute values based on their field type. Returns true if value structure is valid.';

COMMENT ON FUNCTION format_attribute_value_for_display IS
'Formats attribute values for human-readable display based on their field type.';

-- ============================================
-- PART 5: Example configurations for each type
-- ============================================

-- Location example:
-- {
--   "address": "123 Main St",
--   "city": "San Francisco",
--   "state": "CA",
--   "country": "USA",
--   "postal_code": "94102",
--   "coordinates": { "lat": 37.7749, "lng": -122.4194 }
-- }

-- Currency example:
-- {
--   "currency_value": 1234.56,
--   "currency_code": "USD"
-- }

-- Rating example:
-- {
--   "rating": 4,
--   "max_rating": 5
-- }

-- Timestamp example:
-- {
--   "timestamp": "2023-01-01T12:00:00Z",
--   "timezone": "America/Los_Angeles"
-- }

-- Interaction example:
-- {
--   "interaction_type": "email",
--   "interacted_at": "2023-01-01T12:00:00Z",
--   "owner_actor": { "id": "user-uuid", "type": "user" }
-- }

-- Actor Reference example:
-- {
--   "id": "user-uuid",
--   "type": "user"
-- }

-- Personal Name example:
-- {
--   "first_name": "John",
--   "last_name": "Doe",
--   "full_name": "John Doe",
--   "prefix": "Dr.",
--   "suffix": "Jr."
-- }


