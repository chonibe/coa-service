-- Function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = $1
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- Function to run arbitrary SQL (for admin use only)
CREATE OR REPLACE FUNCTION run_sql(sql text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
