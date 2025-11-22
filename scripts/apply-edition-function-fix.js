const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const sql = `
-- Fix assign_edition_numbers to use TEXT-only comparisons
DROP FUNCTION IF EXISTS assign_edition_numbers(TEXT);

CREATE FUNCTION assign_edition_numbers(p_product_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    edition_count INTEGER := 0;
    line_item RECORD;
    v_edition_size INTEGER;
    v_is_open_edition BOOLEAN;
    next_available_number INTEGER := 1;
    used_edition_numbers INTEGER[];
BEGIN
    -- Get the edition_size and check if it's an open edition
    -- Use TEXT comparison only for product_id (order_line_items_v2.product_id is TEXT)
    SELECT 
        edition_size,
        (edition_size IS NULL OR edition_size = 0) INTO v_edition_size, v_is_open_edition
    FROM products
    WHERE "product_id"::text = p_product_id::text;

    -- Get all edition numbers currently used by authenticated items (preserve these)
    SELECT ARRAY_AGG(edition_number) INTO used_edition_numbers
    FROM "public"."order_line_items_v2"
    WHERE "product_id"::text = p_product_id::text
    AND status = 'active'
    AND nfc_claimed_at IS NOT NULL
    AND edition_number IS NOT NULL;

    -- If no authenticated items, start from 1, otherwise find max
    IF used_edition_numbers IS NULL OR array_length(used_edition_numbers, 1) IS NULL THEN
        next_available_number := 1;
    ELSE
        -- Find the next available number that's not in the used list
        WHILE next_available_number = ANY(used_edition_numbers) LOOP
            next_available_number := next_available_number + 1;
        END LOOP;
    END IF;

    -- Clear any existing edition numbers for non-authenticated items only
    UPDATE "public"."order_line_items_v2"
    SET edition_number = NULL
    WHERE "product_id"::text = p_product_id::text
    AND (nfc_claimed_at IS NULL);

    -- Get all active line items for this product, ordered by creation date
    FOR line_item IN 
        SELECT id, created_at, nfc_claimed_at, edition_number
        FROM "public"."order_line_items_v2"
        WHERE "product_id"::text = p_product_id::text
        AND status = 'active'
        ORDER BY created_at ASC
    LOOP
        -- Skip if this item is already authenticated (preserve its edition number)
        IF line_item.nfc_claimed_at IS NOT NULL AND line_item.edition_number IS NOT NULL THEN
            CONTINUE;
        END IF;
        
        -- Find next available number that's not used by authenticated items
        WHILE next_available_number = ANY(COALESCE(used_edition_numbers, ARRAY[]::INTEGER[])) LOOP
            next_available_number := next_available_number + 1;
        END LOOP;
        
        -- For limited editions, check if we've exceeded the edition size
        IF NOT v_is_open_edition AND next_available_number > v_edition_size THEN
            RAISE EXCEPTION 'Cannot assign edition number %: exceeds edition size of %', next_available_number, v_edition_size;
        END IF;

        -- Update the line item with its edition number
        UPDATE "public"."order_line_items_v2"
        SET 
            edition_number = next_available_number,
            edition_total = CASE 
                WHEN v_is_open_edition THEN NULL  -- Open editions have no total
                ELSE v_edition_size              -- Limited editions use the edition_size
            END
        WHERE id = line_item.id;
        
        edition_count := edition_count + 1;
        next_available_number := next_available_number + 1;
    END LOOP;

    RETURN edition_count;
END;
$$;
`

async function applyFix() {
  console.log('Applying fix to assign_edition_numbers function...')
  
  const { error } = await supabase.rpc('exec_sql', { query: sql })
  
  if (error) {
    // Try direct SQL execution
    const { error: directError } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1)
    
    if (directError) {
      console.error('Error:', error)
      console.log('\nTrying alternative method...')
      
      // Split SQL into individual statements
      const statements = sql.split(';').filter(s => s.trim().length > 0)
      
      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { query: statement + ';' })
          if (stmtError) {
            console.error(`Error in statement: ${stmtError.message}`)
          }
        } catch (err) {
          console.error(`Exception: ${err.message}`)
        }
      }
    }
  } else {
    console.log('✓ Function updated successfully')
  }
  
  console.log('\nNote: If the function update failed, you may need to run this SQL directly in Supabase SQL Editor')
}

applyFix()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })

