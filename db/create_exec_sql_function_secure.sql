-- Secure version of exec_sql function with validation and audit logging
-- This function should only be used for migrations and admin operations
-- It includes input validation and audit logging

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS sql_execution_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_by TEXT,
  sql_query TEXT,
  query_type TEXT,
  allowed BOOLEAN,
  error_message TEXT
);

-- Create index for audit queries
CREATE INDEX IF NOT EXISTS idx_sql_execution_audit_executed_at ON sql_execution_audit(executed_at);
CREATE INDEX IF NOT EXISTS idx_sql_execution_audit_executed_by ON sql_execution_audit(executed_by);

-- Secure exec_sql function with validation
CREATE OR REPLACE FUNCTION exec_sql(
  sql_query TEXT,
  executed_by TEXT DEFAULT 'system'
)
RETURNS JSONB AS $$
DECLARE
  query_upper TEXT;
  query_type TEXT;
  is_allowed BOOLEAN := false;
  result JSONB;
  audit_id UUID;
BEGIN
  -- Normalize query for validation
  query_upper := UPPER(TRIM(sql_query));
  
  -- Determine query type
  IF query_upper LIKE 'SELECT%' THEN
    query_type := 'SELECT';
  ELSIF query_upper LIKE 'INSERT%' THEN
    query_type := 'INSERT';
  ELSIF query_upper LIKE 'UPDATE%' THEN
    query_type := 'UPDATE';
  ELSIF query_upper LIKE 'DELETE%' THEN
    query_type := 'DELETE';
  ELSIF query_upper LIKE 'CREATE%' THEN
    query_type := 'CREATE';
  ELSIF query_upper LIKE 'ALTER%' THEN
    query_type := 'ALTER';
  ELSIF query_upper LIKE 'DROP%' THEN
    query_type := 'DROP';
  ELSE
    query_type := 'UNKNOWN';
  END IF;
  
  -- Security: Only allow specific safe operations
  -- For read-only operations (SELECT), allow with restrictions
  -- For write operations, require additional validation
  IF query_type = 'SELECT' THEN
    -- Allow SELECT queries but check for dangerous patterns
    IF query_upper LIKE '%DROP%' OR 
       query_upper LIKE '%DELETE%' OR 
       query_upper LIKE '%TRUNCATE%' OR
       query_upper LIKE '%EXECUTE%' OR
       query_upper LIKE '%EXEC%' THEN
      is_allowed := false;
    ELSE
      -- Limit SELECT queries to prevent resource exhaustion
      -- Add LIMIT if not present (max 1000 rows for safety)
      IF query_upper NOT LIKE '%LIMIT%' THEN
        sql_query := sql_query || ' LIMIT 1000';
      END IF;
      is_allowed := true;
    END IF;
  ELSIF query_type IN ('CREATE', 'ALTER') THEN
    -- Allow CREATE and ALTER for migrations, but log everything
    is_allowed := true;
  ELSE
    -- Block other operations by default
    is_allowed := false;
  END IF;
  
  -- Log the attempt
  INSERT INTO sql_execution_audit (
    executed_by,
    sql_query,
    query_type,
    allowed
  ) VALUES (
    executed_by,
    sql_query,
    query_type,
    is_allowed
  ) RETURNING id INTO audit_id;
  
  -- If not allowed, return error
  IF NOT is_allowed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Query type not allowed or contains dangerous operations',
      'query_type', query_type,
      'audit_id', audit_id
    );
  END IF;
  
  -- Execute the query
  BEGIN
    -- For SELECT queries, return results
    IF query_type = 'SELECT' THEN
      EXECUTE sql_query INTO result;
      RETURN jsonb_build_object(
        'success', true,
        'query_type', query_type,
        'result', result,
        'audit_id', audit_id
      );
    ELSE
      -- For other queries, execute and return success
      EXECUTE sql_query;
      RETURN jsonb_build_object(
        'success', true,
        'query_type', query_type,
        'audit_id', audit_id
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error
    UPDATE sql_execution_audit
    SET error_message = SQLERRM
    WHERE id = audit_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'query_type', query_type,
      'audit_id', audit_id
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission only to service role
-- Revoke from public
REVOKE EXECUTE ON FUNCTION exec_sql(TEXT, TEXT) FROM PUBLIC;
-- Note: Grant to specific roles as needed via Supabase dashboard



