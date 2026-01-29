-- Migration: Add Section Group Block type and parent_block_id for nested blocks
-- This enables Shopify-like sections where a section can contain multiple child blocks

-- Add the Section Group benefit type
INSERT INTO benefit_types (name, description)
VALUES (
  'Artwork Section Group Block',
  'A container section that can hold multiple nested content blocks'
)
ON CONFLICT (name) DO NOTHING;

-- Add parent_block_id column to product_benefits for block nesting
-- NULL means top-level block, a value means child of that parent block
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_benefits' 
    AND column_name = 'parent_block_id'
  ) THEN
    ALTER TABLE product_benefits 
    ADD COLUMN parent_block_id INTEGER REFERENCES product_benefits(id) ON DELETE CASCADE;
    
    -- Add index for efficient queries of child blocks
    CREATE INDEX IF NOT EXISTS idx_product_benefits_parent_block_id 
    ON product_benefits(parent_block_id) 
    WHERE parent_block_id IS NOT NULL;
    
    COMMENT ON COLUMN product_benefits.parent_block_id IS 
      'References a parent Section Group block. NULL for top-level blocks.';
  END IF;
END $$;

-- Add display_order_in_parent for ordering within a section (different from top-level display_order)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_benefits' 
    AND column_name = 'display_order_in_parent'
  ) THEN
    ALTER TABLE product_benefits 
    ADD COLUMN display_order_in_parent INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN product_benefits.display_order_in_parent IS 
      'Order of this block within its parent section. Used when parent_block_id is set.';
  END IF;
END $$;
