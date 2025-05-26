-- Remove PII fields from customers table
ALTER TABLE "public"."customers"
DROP COLUMN IF EXISTS "first_name",
DROP COLUMN IF EXISTS "last_name";

-- Remove PII fields from orders table
ALTER TABLE "public"."orders"
DROP COLUMN IF EXISTS "customer_email",
DROP COLUMN IF EXISTS "customer_reference";

-- Remove PII fields from order_line_items table
ALTER TABLE "public"."order_line_items"
DROP COLUMN IF EXISTS "owner_name",
DROP COLUMN IF EXISTS "owner_email";

-- Remove PII fields from otp_tokens table
DROP TABLE IF EXISTS "public"."otp_tokens";

-- Update RLS policies to remove PII-based access
DROP POLICY IF EXISTS "Users can only view line items for their own orders" ON "public"."line_items";
DROP POLICY IF EXISTS "Users can only view their own orders" ON "public"."orders";

-- Create new RLS policies based on customer_id only
CREATE POLICY "Users can only view line items for their customer_id" ON "public"."line_items"
    FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM orders
            WHERE customer_id = auth.jwt() ->> 'customer_id'
        )
    );

CREATE POLICY "Users can only view orders for their customer_id" ON "public"."orders"
    FOR SELECT
    USING (customer_id = auth.jwt() ->> 'customer_id'); 