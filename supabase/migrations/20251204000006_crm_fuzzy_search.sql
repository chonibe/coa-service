-- Migration: Fuzzy Search Support
-- Adds fuzzy search capabilities using PostgreSQL trigram similarity
-- Date: 2025-12-04

-- ============================================
-- PART 1: Enable pg_trgm extension for fuzzy matching
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- PART 2: Create function to enable pg_trgm if needed
-- ============================================

CREATE OR REPLACE FUNCTION enable_pg_trgm_if_needed()
RETURNS void AS $$
BEGIN
  -- Extension is already enabled if we get here
  -- This function exists for API compatibility
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: Fuzzy search function for people
-- ============================================

CREATE OR REPLACE FUNCTION fuzzy_search_people(
  search_term TEXT,
  similarity_threshold NUMERIC DEFAULT 0.3,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  instagram_username TEXT,
  similarity NUMERIC,
  matched_fields TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    COALESCE(
      TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')),
      c.email,
      'Unknown'
    ) AS display_name,
    c.email,
    c.phone,
    c.instagram_username,
    GREATEST(
      COALESCE(similarity(COALESCE(c.first_name || ' ' || c.last_name, ''), search_term), 0),
      COALESCE(similarity(COALESCE(c.email, ''), search_term), 0),
      COALESCE(similarity(COALESCE(c.phone, ''), search_term), 0),
      COALESCE(similarity(COALESCE(c.instagram_username, ''), search_term), 0)
    ) AS similarity,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN similarity(COALESCE(c.first_name || ' ' || c.last_name, ''), search_term) >= similarity_threshold THEN 'name' END,
      CASE WHEN similarity(COALESCE(c.email, ''), search_term) >= similarity_threshold THEN 'email' END,
      CASE WHEN similarity(COALESCE(c.phone, ''), search_term) >= similarity_threshold THEN 'phone' END,
      CASE WHEN similarity(COALESCE(c.instagram_username, ''), search_term) >= similarity_threshold THEN 'instagram' END
    ], NULL) AS matched_fields
  FROM crm_customers c
  WHERE
    c.is_archived = false
    AND (
      similarity(COALESCE(c.first_name || ' ' || c.last_name, ''), search_term) >= similarity_threshold
      OR similarity(COALESCE(c.email, ''), search_term) >= similarity_threshold
      OR similarity(COALESCE(c.phone, ''), search_term) >= similarity_threshold
      OR similarity(COALESCE(c.instagram_username, ''), search_term) >= similarity_threshold
      OR c.email ILIKE '%' || search_term || '%'
      OR c.first_name ILIKE '%' || search_term || '%'
      OR c.last_name ILIKE '%' || search_term || '%'
      OR c.phone ILIKE '%' || search_term || '%'
    )
  ORDER BY similarity DESC, c.created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 4: Fuzzy search function for companies
-- ============================================

CREATE OR REPLACE FUNCTION fuzzy_search_companies(
  search_term TEXT,
  similarity_threshold NUMERIC DEFAULT 0.3,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  domain TEXT,
  website TEXT,
  industry TEXT,
  similarity NUMERIC,
  matched_fields TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.domain,
    c.website,
    c.industry,
    GREATEST(
      COALESCE(similarity(COALESCE(c.name, ''), search_term), 0),
      COALESCE(similarity(COALESCE(c.domain, ''), search_term), 0),
      COALESCE(similarity(COALESCE(c.website, ''), search_term), 0),
      COALESCE(similarity(COALESCE(c.industry, ''), search_term), 0)
    ) AS similarity,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN similarity(COALESCE(c.name, ''), search_term) >= similarity_threshold THEN 'name' END,
      CASE WHEN similarity(COALESCE(c.domain, ''), search_term) >= similarity_threshold THEN 'domain' END,
      CASE WHEN similarity(COALESCE(c.website, ''), search_term) >= similarity_threshold THEN 'website' END,
      CASE WHEN similarity(COALESCE(c.industry, ''), search_term) >= similarity_threshold THEN 'industry' END
    ], NULL) AS matched_fields
  FROM crm_companies c
  WHERE
    c.is_archived = false
    AND (
      similarity(COALESCE(c.name, ''), search_term) >= similarity_threshold
      OR similarity(COALESCE(c.domain, ''), search_term) >= similarity_threshold
      OR similarity(COALESCE(c.website, ''), search_term) >= similarity_threshold
      OR similarity(COALESCE(c.industry, ''), search_term) >= similarity_threshold
      OR c.name ILIKE '%' || search_term || '%'
      OR c.domain ILIKE '%' || search_term || '%'
      OR c.website ILIKE '%' || search_term || '%'
    )
  ORDER BY similarity DESC, c.created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 5: Create indexes for better search performance
-- ============================================

-- GIN indexes for trigram similarity (if not already created)
CREATE INDEX IF NOT EXISTS idx_crm_customers_name_trgm ON crm_customers USING GIN ((COALESCE(first_name || ' ' || last_name, '')) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_crm_customers_email_trgm ON crm_customers USING GIN (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_crm_customers_phone_trgm ON crm_customers USING GIN (phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_crm_companies_name_trgm ON crm_companies USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_crm_companies_domain_trgm ON crm_companies USING GIN (domain gin_trgm_ops);

-- ============================================
-- PART 6: Comments for documentation
-- ============================================

COMMENT ON FUNCTION fuzzy_search_people IS
'Fuzzy search for people using trigram similarity. Returns results with similarity scores and matched fields.';

COMMENT ON FUNCTION fuzzy_search_companies IS
'Fuzzy search for companies using trigram similarity. Returns results with similarity scores and matched fields.';

COMMENT ON FUNCTION enable_pg_trgm_if_needed IS
'Placeholder function for API compatibility. pg_trgm extension should be enabled via migration.';

