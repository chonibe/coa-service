

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "admin";


ALTER SCHEMA "admin" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "admin"."sync_artwork_from_shopify"("p_shopify_product_id" character varying, "p_shopify_customer_id" character varying, "p_title" character varying, "p_description" "text", "p_image_url" "text", "p_metadata" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  artwork_id UUID;
BEGIN
  -- Check if artwork already exists
  SELECT id INTO artwork_id FROM artworks 
  WHERE shopify_product_id = p_shopify_product_id;
  
  IF artwork_id IS NULL THEN
    -- Insert new artwork
    INSERT INTO artworks (
      shopify_customer_id,
      shopify_product_id,
      title,
      description,
      image_url,
      metadata
    ) VALUES (
      p_shopify_customer_id,
      p_shopify_product_id,
      p_title,
      p_description,
      p_image_url,
      p_metadata
    )
    RETURNING id INTO artwork_id;
  ELSE
    -- Update existing artwork
    UPDATE artworks SET
      title = p_title,
      description = p_description,
      image_url = p_image_url,
      metadata = p_metadata,
      updated_at = NOW()
    WHERE id = artwork_id;
  END IF;
  
  RETURN artwork_id;
END;
$$;


ALTER FUNCTION "admin"."sync_artwork_from_shopify"("p_shopify_product_id" character varying, "p_shopify_customer_id" character varying, "p_title" character varying, "p_description" "text", "p_image_url" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_edition_numbers"("product_id" "text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    edition_count INTEGER := 0;
    line_item RECORD;
BEGIN
    -- Create a temporary table to hold sorted line items
    CREATE TEMP TABLE sorted_line_items AS
    SELECT 
        li.id,
        li.shopify_line_item_id,
        li.quantity,
        o.created_at
    FROM 
        line_items li
    JOIN 
        orders o ON li.order_id = o.id
    WHERE 
        li.shopify_product_id = product_id
    ORDER BY 
        o.created_at ASC;
    
    -- Clear any existing edition numbers for this product
    DELETE FROM edition_numbers WHERE shopify_product_id = product_id;
    
    -- Assign sequential edition numbers
    FOR line_item IN SELECT * FROM sorted_line_items LOOP
        FOR i IN 1..line_item.quantity LOOP
            edition_count := edition_count + 1;
            
            -- Insert the edition number
            INSERT INTO edition_numbers (
                line_item_id,
                shopify_line_item_id,
                shopify_product_id,
                edition_number
            ) VALUES (
                line_item.id,
                line_item.shopify_line_item_id,
                product_id,
                edition_count
            );
        END LOOP;
    END LOOP;
    
    -- Update the product_editions table with the total count
    INSERT INTO product_editions (
        shopify_product_id,
        total_sold,
        last_calculated
    ) VALUES (
        product_id,
        edition_count,
        NOW()
    )
    ON CONFLICT (shopify_product_id) 
    DO UPDATE SET
        total_sold = edition_count,
        last_calculated = NOW();
    
    -- Drop the temporary table
    DROP TABLE sorted_line_items;
    
    RETURN edition_count;
END;
$$;


ALTER FUNCTION "public"."calculate_edition_numbers"("product_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_orphaned_products"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Delete products that haven't been referenced in order_line_items for more than 30 days
    DELETE FROM products
    WHERE id NOT IN (
        SELECT DISTINCT product_id 
        FROM order_line_items 
        WHERE created_at > NOW() - INTERVAL '30 days'
    );
END;
$$;


ALTER FUNCTION "public"."cleanup_orphaned_products"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_policy_if_not_exists"("policy_name" "text", "table_name" "text", "action" "text", "roles" "text", "using_expr" "text" DEFAULT NULL::"text", "with_check_expr" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = table_name
          AND policyname = policy_name
    ) THEN
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR %s TO %s %s %s',
            policy_name,
            table_name,
            action,
            roles,
            CASE WHEN using_expr IS NOT NULL THEN 'USING (' || using_expr || ')' ELSE '' END,
            CASE WHEN with_check_expr IS NOT NULL THEN 'WITH CHECK (' || with_check_expr || ')' ELSE '' END
        );
    END IF;
END;
$$;


ALTER FUNCTION "public"."create_policy_if_not_exists"("policy_name" "text", "table_name" "text", "action" "text", "roles" "text", "using_expr" "text", "with_check_expr" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."exec_sql"("sql_query" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;


ALTER FUNCTION "public"."exec_sql"("sql_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resequence_edition_numbers"("product_id_param" "text") RETURNS "json"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    active_items_count INTEGER := 0;
    removed_items_count INTEGER := 0;
    total_items_count INTEGER := 0;
    edition_counter INTEGER := 1;
    item RECORD;
BEGIN
    -- Count active and removed items
    SELECT COUNT(*) INTO active_items_count
    FROM order_line_items
    WHERE product_id = product_id_param AND status = 'active';
    
    SELECT COUNT(*) INTO removed_items_count
    FROM order_line_items
    WHERE product_id = product_id_param AND status = 'removed';
    
    total_items_count := active_items_count + removed_items_count;
    
    -- First, ensure all removed items have null edition numbers
    UPDATE order_line_items
    SET edition_number = NULL,
        updated_at = NOW()
    WHERE product_id = product_id_param AND status = 'removed';
    
    -- Then, assign sequential edition numbers to active items
    FOR item IN 
        SELECT * FROM order_line_items
        WHERE product_id = product_id_param AND status = 'active'
        ORDER BY created_at ASC
    LOOP
        UPDATE order_line_items
        SET edition_number = edition_counter,
            updated_at = NOW()
        WHERE line_item_id = item.line_item_id AND order_id = item.order_id;
        
        edition_counter := edition_counter + 1;
    END LOOP;
    
    -- Return the results
    RETURN json_build_object(
        'success', TRUE,
        'active_items', active_items_count,
        'removed_items', removed_items_count,
        'total_items', total_items_count,
        'last_edition_number', edition_counter - 1
    );
END;
$$;


ALTER FUNCTION "public"."resequence_edition_numbers"("product_id_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."scheduled_cleanup"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Delete products that haven't been referenced in order_line_items for more than 30 days
    DELETE FROM products
    WHERE id NOT IN (
        SELECT DISTINCT product_id 
        FROM order_line_items 
        WHERE created_at > NOW() - INTERVAL '30 days'
    );
    
    -- Log the cleanup
    RAISE NOTICE 'Cleanup completed at %', NOW();
END;
$$;


ALTER FUNCTION "public"."scheduled_cleanup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."setup_cleanup_schedule"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if pg_cron extension exists
    IF EXISTS (
        SELECT 1 
        FROM pg_extension 
        WHERE extname = 'pg_cron'
    ) THEN
        -- Schedule the cleanup job
        PERFORM cron.schedule(
            'cleanup-orphaned-products',
            '0 0 * * *', -- Run at midnight every day
            'SELECT cleanup_orphaned_products();'
        );
    ELSE
        -- Log that pg_cron is not available
        RAISE NOTICE 'pg_cron extension is not available. Cleanup will need to be scheduled manually.';
    END IF;
END;
$$;


ALTER FUNCTION "public"."setup_cleanup_schedule"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_all_products"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Insert or update all products from order_line_items
    INSERT INTO products (
        id,
        vendor_name,
        name,
        description,
        price,
        updated_at
    )
    SELECT DISTINCT
        oli.product_id,
        oli.vendor_name,
        oli.name,
        oli.description,
        oli.price,
        NOW()
    FROM order_line_items oli
    ON CONFLICT (id) DO UPDATE
    SET
        vendor_name = EXCLUDED.vendor_name,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."sync_all_products"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_products"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Insert or update the product in the products table
    INSERT INTO products (
        id,
        vendor_name,
        name,
        description,
        price,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.vendor_name,
        NEW.name,
        NEW.description,
        NEW.price,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
        vendor_name = EXCLUDED.vendor_name,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        updated_at = NOW();

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_products"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."benefit_types" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."benefit_types" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."benefit_types_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."benefit_types_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."benefit_types_id_seq" OWNED BY "public"."benefit_types"."id";



CREATE TABLE IF NOT EXISTS "public"."certificate_access_logs" (
    "id" integer NOT NULL,
    "line_item_id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "product_id" "text" NOT NULL,
    "accessed_at" timestamp with time zone DEFAULT "now"(),
    "ip_address" "text",
    "user_agent" "text"
);


ALTER TABLE "public"."certificate_access_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."certificate_access_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."certificate_access_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."certificate_access_logs_id_seq" OWNED BY "public"."certificate_access_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."collector_benefit_claims" (
    "id" integer NOT NULL,
    "product_benefit_id" integer,
    "line_item_id" "text" NOT NULL,
    "customer_email" "text",
    "claimed_at" timestamp with time zone DEFAULT "now"(),
    "claim_code" "text",
    "status" "text" DEFAULT 'active'::"text"
);


ALTER TABLE "public"."collector_benefit_claims" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."collector_benefit_claims_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."collector_benefit_claims_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."collector_benefit_claims_id_seq" OWNED BY "public"."collector_benefit_claims"."id";



CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "shopify_customer_id" "text",
    "first_name" "text",
    "last_name" "text",
    "access_token" "text",
    "access_token_expires_at" timestamp with time zone,
    "shopify_access_token" "text",
    "shopify_shop_domain" "text",
    "orders_count" smallint
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instagram_media_cache" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "instagram_media_id" "text" NOT NULL,
    "username" "text" NOT NULL,
    "media_type" "text" NOT NULL,
    "media_url" "text" NOT NULL,
    "thumbnail_url" "text",
    "permalink" "text" NOT NULL,
    "caption" "text",
    "timestamp" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."instagram_media_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instagram_profile_cache" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "username" "text" NOT NULL,
    "profile_picture_url" "text",
    "followers_count" integer,
    "media_count" integer,
    "biography" "text",
    "name" "text",
    "website" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."instagram_profile_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instagram_stories_cache" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "instagram_media_id" "text" NOT NULL,
    "username" "text" NOT NULL,
    "media_type" "text" NOT NULL,
    "media_url" "text" NOT NULL,
    "permalink" "text" NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."instagram_stories_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instagram_story_views" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "collector_id" "uuid" NOT NULL,
    "instagram_media_id" "text" NOT NULL,
    "viewed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."instagram_story_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instagram_vendors" (
    "vendor_id" character varying(255) NOT NULL,
    "instagram_username" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."instagram_vendors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."line_items" (
    "id" "text" NOT NULL,
    "order_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "currency_code" "text" NOT NULL,
    "image_url" "text",
    "image_alt" "text",
    "shopify_id" "text",
    "sku" "text",
    "variant_id" "text",
    "product_id" "text"
);


ALTER TABLE "public"."line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nfc_tags" (
    "id" integer NOT NULL,
    "tag_id" character varying(255) NOT NULL,
    "line_item_id" character varying(255),
    "order_id" character varying(255),
    "certificate_url" "text",
    "status" character varying(50) DEFAULT 'unassigned'::character varying NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "programmed_at" timestamp with time zone,
    "customer_id" character varying(255),
    "claimed_at" timestamp with time zone
);


ALTER TABLE "public"."nfc_tags" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."nfc_tags_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."nfc_tags_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."nfc_tags_id_seq" OWNED BY "public"."nfc_tags"."id";



CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "text" NOT NULL,
    "shopify_line_item_id" bigint NOT NULL,
    "product_id" "uuid",
    "variant_id" bigint,
    "title" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "sku" "text",
    "vendor" "text",
    "properties" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_line_items" (
    "id" integer NOT NULL,
    "order_id" "text" NOT NULL,
    "order_name" "text",
    "line_item_id" "text" NOT NULL,
    "product_id" "text" NOT NULL,
    "variant_id" "text",
    "created_at" timestamp with time zone NOT NULL,
    "processed_at" timestamp with time zone,
    "edition_number" integer,
    "removed_reason" "text",
    "status" "text" DEFAULT 'active'::"text",
    "updated_at" timestamp with time zone,
    "certificate_url" "text",
    "certificate_token" "text",
    "certificate_generated_at" timestamp with time zone,
    "owner_name" "text",
    "owner_email" "text",
    "claimed_at" timestamp with time zone,
    "nfc_tag_id" character varying(255),
    "nfc_claimed_at" timestamp with time zone,
    "payout_amount" numeric,
    "payout_type" character varying(50) DEFAULT 'percentage'::character varying,
    "vendor_name" character varying(255),
    "price" numeric(10,2),
    "edition_total" integer,
    "fulfillment_status" "text",
    "name" "text",
    "description" "text"
);


ALTER TABLE "public"."order_line_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."order_line_items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."order_line_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."order_line_items_id_seq" OWNED BY "public"."order_line_items"."id";



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "text" NOT NULL,
    "order_number" integer NOT NULL,
    "processed_at" timestamp with time zone NOT NULL,
    "financial_status" "text",
    "fulfillment_status" "text",
    "total_price" numeric(10,2) NOT NULL,
    "currency_code" "text" NOT NULL,
    "customer_email" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "customer_id" "text",
    "shopify_id" "text",
    "subtotal_price" numeric(10,2),
    "total_tax" numeric(10,2),
    "customer_reference" "text",
    "raw_shopify_order_data" "jsonb",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON TABLE "public"."orders" IS 'Stores order information synced from Shopify.';



COMMENT ON COLUMN "public"."orders"."id" IS 'Shopify Order ID. Primary Key.';



COMMENT ON COLUMN "public"."orders"."customer_id" IS 'Foreign key referencing the customers table.';



COMMENT ON COLUMN "public"."orders"."raw_shopify_order_data" IS 'Full JSON object of the order from Shopify API.';



CREATE TABLE IF NOT EXISTS "public"."otp_tokens" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."otp_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "page_views" integer DEFAULT 0 NOT NULL,
    "unique_visitors" integer DEFAULT 0 NOT NULL,
    "average_time_on_page" integer DEFAULT 0 NOT NULL,
    "bounce_rate" numeric(5,2) DEFAULT 0 NOT NULL,
    "conversion_rate" numeric(5,2) DEFAULT 0 NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."product_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_benefits" (
    "id" integer NOT NULL,
    "product_id" "text" NOT NULL,
    "vendor_name" "text" NOT NULL,
    "benefit_type_id" integer,
    "title" "text" NOT NULL,
    "description" "text",
    "content_url" "text",
    "access_code" "text",
    "is_active" boolean DEFAULT true,
    "starts_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_benefits" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."product_benefits_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."product_benefits_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."product_benefits_id_seq" OWNED BY "public"."product_benefits"."id";



CREATE TABLE IF NOT EXISTS "public"."product_edition_counters" (
    "id" integer NOT NULL,
    "product_id" "text" NOT NULL,
    "product_title" "text",
    "current_edition_number" integer DEFAULT 0 NOT NULL,
    "edition_total" "text",
    "last_updated" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_edition_counters" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."product_edition_counters_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."product_edition_counters_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."product_edition_counters_id_seq" OWNED BY "public"."product_edition_counters"."id";



CREATE TABLE IF NOT EXISTS "public"."product_vendor_payouts" (
    "id" integer NOT NULL,
    "product_id" "text" NOT NULL,
    "vendor_name" "text" NOT NULL,
    "payout_amount" numeric(10,2),
    "is_percentage" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_vendor_payouts" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."product_vendor_payouts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."product_vendor_payouts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."product_vendor_payouts_id_seq" OWNED BY "public"."product_vendor_payouts"."id";



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_name" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "handle" "text",
    "sku" character varying(255),
    "edition_size" character varying(255),
    "product_id" "text",
    "image_url" "text",
    "parent_shopify_id" "text"
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopify_customers" (
    "id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "shopify_customer_id" "text" NOT NULL,
    "shopify_customer_access_token" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shopify_customers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."shopify_customers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."shopify_customers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."shopify_customers_id_seq" OWNED BY "public"."shopify_customers"."id";



CREATE TABLE IF NOT EXISTS "public"."sync_logs" (
    "id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "details" "jsonb",
    "type" character varying(255) DEFAULT 'shopify_orders'::character varying
);


ALTER TABLE "public"."sync_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sync_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."sync_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sync_logs_id_seq" OWNED BY "public"."sync_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."sync_status" (
    "id" "text" NOT NULL,
    "initialized" boolean DEFAULT false,
    "last_sync" timestamp with time zone DEFAULT "now"(),
    "total_orders" integer DEFAULT 0,
    "total_line_items" integer DEFAULT 0,
    "last_cursor" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sync_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transfer_history" (
    "id" integer NOT NULL,
    "line_item_id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "previous_owner_name" "text" NOT NULL,
    "previous_owner_email" "text" NOT NULL,
    "new_owner_name" "text" NOT NULL,
    "new_owner_email" "text" NOT NULL,
    "transferred_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transfer_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."transfer_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."transfer_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."transfer_history_id_seq" OWNED BY "public"."transfer_history"."id";



CREATE TABLE IF NOT EXISTS "public"."user_shopify_connections" (
    "id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "customer_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_shopify_connections" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_shopify_connections_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."user_shopify_connections_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_shopify_connections_id_seq" OWNED BY "public"."user_shopify_connections"."id";



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_payouts" (
    "id" integer NOT NULL,
    "vendor_name" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'GBP'::"text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payout_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "reference" "text",
    "product_count" integer DEFAULT 0,
    "payment_method" "text" DEFAULT 'paypal'::"text",
    "payment_id" "text",
    "invoice_number" "text",
    "tax_rate" numeric(5,2) DEFAULT 0,
    "tax_amount" numeric(10,2) DEFAULT 0,
    "notes" "text",
    "processed_by" "text",
    "is_self_billed" boolean DEFAULT true,
    "payment_details" "jsonb"
);


ALTER TABLE "public"."vendor_payouts" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."vendor_payouts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."vendor_payouts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."vendor_payouts_id_seq" OWNED BY "public"."vendor_payouts"."id";



CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" integer NOT NULL,
    "vendor_name" "text" NOT NULL,
    "instagram_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "paypal_email" "text",
    "payout_method" character varying(50) DEFAULT 'paypal'::character varying,
    "password_hash" "text",
    "tax_id" "text",
    "tax_country" "text",
    "is_company" boolean DEFAULT false
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."vendors_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."vendors_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."vendors_id_seq" OWNED BY "public"."vendors"."id";



CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "details" "jsonb",
    "type" character varying(255) DEFAULT 'shopify_order'::character varying
);


ALTER TABLE "public"."webhook_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."webhook_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."webhook_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."webhook_logs_id_seq" OWNED BY "public"."webhook_logs"."id";



ALTER TABLE ONLY "public"."benefit_types" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."benefit_types_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."certificate_access_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."certificate_access_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."collector_benefit_claims" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."collector_benefit_claims_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."nfc_tags" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."nfc_tags_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."order_line_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."order_line_items_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."product_benefits" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_benefits_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."product_edition_counters" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_edition_counters_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."product_vendor_payouts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_vendor_payouts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."shopify_customers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."shopify_customers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sync_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sync_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."transfer_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."transfer_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_shopify_connections" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_shopify_connections_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."vendor_payouts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."vendor_payouts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."vendors" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."vendors_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."webhook_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."webhook_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."benefit_types"
    ADD CONSTRAINT "benefit_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."benefit_types"
    ADD CONSTRAINT "benefit_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certificate_access_logs"
    ADD CONSTRAINT "certificate_access_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collector_benefit_claims"
    ADD CONSTRAINT "collector_benefit_claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_shopify_customer_id_key" UNIQUE ("shopify_customer_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "idx_orders_email" UNIQUE ("id", "customer_email");



ALTER TABLE ONLY "public"."instagram_media_cache"
    ADD CONSTRAINT "instagram_media_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instagram_media_cache"
    ADD CONSTRAINT "instagram_media_cache_username_instagram_media_id_key" UNIQUE ("username", "instagram_media_id");



ALTER TABLE ONLY "public"."instagram_profile_cache"
    ADD CONSTRAINT "instagram_profile_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instagram_profile_cache"
    ADD CONSTRAINT "instagram_profile_cache_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."instagram_stories_cache"
    ADD CONSTRAINT "instagram_stories_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instagram_stories_cache"
    ADD CONSTRAINT "instagram_stories_cache_username_instagram_media_id_key" UNIQUE ("username", "instagram_media_id");



ALTER TABLE ONLY "public"."instagram_story_views"
    ADD CONSTRAINT "instagram_story_views_collector_id_instagram_media_id_key" UNIQUE ("collector_id", "instagram_media_id");



ALTER TABLE ONLY "public"."instagram_story_views"
    ADD CONSTRAINT "instagram_story_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instagram_vendors"
    ADD CONSTRAINT "instagram_vendors_pkey" PRIMARY KEY ("vendor_id");



ALTER TABLE ONLY "public"."line_items"
    ADD CONSTRAINT "line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nfc_tags"
    ADD CONSTRAINT "nfc_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nfc_tags"
    ADD CONSTRAINT "nfc_tags_tag_id_key" UNIQUE ("tag_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_shopify_line_item_id_key" UNIQUE ("order_id", "shopify_line_item_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_line_items"
    ADD CONSTRAINT "order_line_items_order_id_line_item_id_key" UNIQUE ("order_id", "line_item_id");



ALTER TABLE ONLY "public"."order_line_items"
    ADD CONSTRAINT "order_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."otp_tokens"
    ADD CONSTRAINT "otp_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_analytics"
    ADD CONSTRAINT "product_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_benefits"
    ADD CONSTRAINT "product_benefits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_edition_counters"
    ADD CONSTRAINT "product_edition_counters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_edition_counters"
    ADD CONSTRAINT "product_edition_counters_product_id_key" UNIQUE ("product_id");



ALTER TABLE ONLY "public"."product_vendor_payouts"
    ADD CONSTRAINT "product_vendor_payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_vendor_payouts"
    ADD CONSTRAINT "product_vendor_payouts_product_id_vendor_name_key" UNIQUE ("product_id", "vendor_name");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopify_customers"
    ADD CONSTRAINT "shopify_customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sync_logs"
    ADD CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sync_status"
    ADD CONSTRAINT "sync_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transfer_history"
    ADD CONSTRAINT "transfer_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_shopify_connections"
    ADD CONSTRAINT "unique_user_customer" UNIQUE ("user_id", "customer_id");



ALTER TABLE ONLY "public"."order_line_items"
    ADD CONSTRAINT "uq_order_line_item_identity" UNIQUE ("order_id", "line_item_id");



ALTER TABLE ONLY "public"."user_shopify_connections"
    ADD CONSTRAINT "user_shopify_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_payouts"
    ADD CONSTRAINT "vendor_payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_vendor_name_key" UNIQUE ("vendor_name");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");



CREATE INDEX "collector_benefit_claims_line_item_id_idx" ON "public"."collector_benefit_claims" USING "btree" ("line_item_id");



CREATE INDEX "idx_certificate_access_logs_accessed_at" ON "public"."certificate_access_logs" USING "btree" ("accessed_at");



CREATE INDEX "idx_certificate_access_logs_line_item_id" ON "public"."certificate_access_logs" USING "btree" ("line_item_id");



CREATE INDEX "idx_customers_shopify_customer_id" ON "public"."customers" USING "btree" ("shopify_customer_id");



CREATE INDEX "idx_line_items_shopify_id" ON "public"."line_items" USING "btree" ("shopify_id");



CREATE INDEX "idx_nfc_tags_customer_id" ON "public"."nfc_tags" USING "btree" ("customer_id");



CREATE INDEX "idx_nfc_tags_line_item_id" ON "public"."nfc_tags" USING "btree" ("line_item_id");



CREATE INDEX "idx_nfc_tags_status" ON "public"."nfc_tags" USING "btree" ("status");



CREATE INDEX "idx_nfc_tags_tag_id" ON "public"."nfc_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_order_items_product_id" ON "public"."order_items" USING "btree" ("product_id");



CREATE INDEX "idx_order_items_shopify_line_item_id" ON "public"."order_items" USING "btree" ("shopify_line_item_id");



CREATE INDEX "idx_order_line_items_created_at" ON "public"."order_line_items" USING "btree" ("created_at");



CREATE INDEX "idx_order_line_items_edition_total" ON "public"."order_line_items" USING "btree" ("edition_total");



CREATE INDEX "idx_order_line_items_nfc_tag_id" ON "public"."order_line_items" USING "btree" ("nfc_tag_id");



CREATE INDEX "idx_order_line_items_order_id" ON "public"."order_line_items" USING "btree" ("order_id");



CREATE INDEX "idx_order_line_items_price" ON "public"."order_line_items" USING "btree" ("price");



CREATE INDEX "idx_order_line_items_product_id" ON "public"."order_line_items" USING "btree" ("product_id");



CREATE INDEX "idx_order_line_items_status" ON "public"."order_line_items" USING "btree" ("status");



CREATE INDEX "idx_order_line_items_vendor_name" ON "public"."order_line_items" USING "btree" ("vendor_name");



CREATE INDEX "idx_orders_customer_id" ON "public"."orders" USING "btree" ("customer_id");



CREATE INDEX "idx_orders_customer_reference" ON "public"."orders" USING "btree" ("customer_reference");



CREATE INDEX "idx_orders_shopify_id" ON "public"."orders" USING "btree" ("shopify_id");



CREATE INDEX "idx_otp_tokens_email" ON "public"."otp_tokens" USING "btree" ("email");



CREATE INDEX "idx_product_analytics_last_updated" ON "public"."product_analytics" USING "btree" ("last_updated");



CREATE INDEX "idx_product_analytics_product_id" ON "public"."product_analytics" USING "btree" ("product_id");



CREATE INDEX "idx_products_created_at" ON "public"."products" USING "btree" ("created_at");



CREATE INDEX "idx_products_handle" ON "public"."products" USING "btree" ("handle");



CREATE INDEX "idx_products_parent_shopify_id" ON "public"."products" USING "btree" ("parent_shopify_id");



CREATE INDEX "idx_products_product_id" ON "public"."products" USING "btree" ("product_id");



CREATE INDEX "idx_products_updated_at" ON "public"."products" USING "btree" ("updated_at");



CREATE INDEX "idx_products_vendor_name" ON "public"."products" USING "btree" ("vendor_name");



CREATE INDEX "idx_shopify_customers_shopify_customer_id" ON "public"."shopify_customers" USING "btree" ("shopify_customer_id");



CREATE INDEX "idx_shopify_customers_user_id" ON "public"."shopify_customers" USING "btree" ("user_id");



CREATE INDEX "idx_transfer_history_line_item_id" ON "public"."transfer_history" USING "btree" ("line_item_id");



CREATE INDEX "idx_transfer_history_transferred_at" ON "public"."transfer_history" USING "btree" ("transferred_at");



CREATE INDEX "instagram_media_cache_timestamp_idx" ON "public"."instagram_media_cache" USING "btree" ("timestamp");



CREATE INDEX "instagram_media_cache_username_idx" ON "public"."instagram_media_cache" USING "btree" ("username");



CREATE INDEX "instagram_stories_cache_timestamp_idx" ON "public"."instagram_stories_cache" USING "btree" ("timestamp");



CREATE INDEX "instagram_stories_cache_username_idx" ON "public"."instagram_stories_cache" USING "btree" ("username");



CREATE INDEX "instagram_story_views_collector_id_idx" ON "public"."instagram_story_views" USING "btree" ("collector_id");



CREATE INDEX "instagram_story_views_instagram_media_id_idx" ON "public"."instagram_story_views" USING "btree" ("instagram_media_id");



CREATE INDEX "product_benefits_product_id_idx" ON "public"."product_benefits" USING "btree" ("product_id");



CREATE INDEX "product_benefits_vendor_name_idx" ON "public"."product_benefits" USING "btree" ("vendor_name");



CREATE INDEX "product_vendor_payouts_product_id_idx" ON "public"."product_vendor_payouts" USING "btree" ("product_id");



CREATE INDEX "product_vendor_payouts_vendor_name_idx" ON "public"."product_vendor_payouts" USING "btree" ("vendor_name");



CREATE INDEX "vendor_payouts_status_idx" ON "public"."vendor_payouts" USING "btree" ("status");



CREATE INDEX "vendor_payouts_vendor_name_idx" ON "public"."vendor_payouts" USING "btree" ("vendor_name");



CREATE INDEX "vendors_vendor_name_idx" ON "public"."vendors" USING "btree" ("vendor_name");



CREATE OR REPLACE TRIGGER "sync_products_trigger" AFTER INSERT OR UPDATE ON "public"."order_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."sync_products"();



CREATE OR REPLACE TRIGGER "update_customers_modtime" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_instagram_media_cache_updated_at" BEFORE UPDATE ON "public"."instagram_media_cache" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_instagram_profile_cache_updated_at" BEFORE UPDATE ON "public"."instagram_profile_cache" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_instagram_stories_cache_updated_at" BEFORE UPDATE ON "public"."instagram_stories_cache" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_modtime" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



ALTER TABLE ONLY "public"."collector_benefit_claims"
    ADD CONSTRAINT "collector_benefit_claims_product_benefit_id_fkey" FOREIGN KEY ("product_benefit_id") REFERENCES "public"."product_benefits"("id");



ALTER TABLE ONLY "public"."line_items"
    ADD CONSTRAINT "line_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nfc_tags"
    ADD CONSTRAINT "nfc_tags_line_item_id_order_id_fkey" FOREIGN KEY ("line_item_id", "order_id") REFERENCES "public"."order_line_items"("line_item_id", "order_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."product_analytics"
    ADD CONSTRAINT "product_analytics_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_benefits"
    ADD CONSTRAINT "product_benefits_benefit_type_id_fkey" FOREIGN KEY ("benefit_type_id") REFERENCES "public"."benefit_types"("id");



ALTER TABLE ONLY "public"."shopify_customers"
    ADD CONSTRAINT "shopify_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_shopify_connections"
    ADD CONSTRAINT "user_shopify_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_payouts"
    ADD CONSTRAINT "vendor_payouts_vendor_name_fkey" FOREIGN KEY ("vendor_name") REFERENCES "public"."vendors"("vendor_name");



CREATE POLICY "Allow all access to line_items" ON "public"."line_items" USING (true);



CREATE POLICY "Allow all access to orders" ON "public"."orders" USING (true);



CREATE POLICY "Allow delete for authenticated users only" ON "public"."otp_tokens" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow insert for authenticated users only" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow insert for authenticated users only" ON "public"."otp_tokens" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow select for authenticated users only" ON "public"."customers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow update for authenticated users only" ON "public"."customers" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable insert for service role" ON "public"."order_items" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."order_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update for service role" ON "public"."order_items" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Server can insert line items" ON "public"."line_items" FOR INSERT WITH CHECK (true);



CREATE POLICY "Server can insert orders" ON "public"."orders" FOR INSERT WITH CHECK (true);



CREATE POLICY "Server can update line items" ON "public"."line_items" FOR UPDATE USING (true);



CREATE POLICY "Server can update orders" ON "public"."orders" FOR UPDATE USING (true);



CREATE POLICY "Service role can manage all analytics" ON "public"."product_analytics" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all products" ON "public"."products" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can only view line items for their own orders" ON "public"."line_items" FOR SELECT USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("auth"."uid"() IN ( SELECT "users"."id"
           FROM "auth"."users"
          WHERE (("users"."email")::"text" = "orders"."customer_email"))))));



CREATE POLICY "Users can only view their own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = "orders"."customer_email"))));



CREATE POLICY "Vendors can manage their own products" ON "public"."products" USING (("vendor_name" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "Vendors can view their own product analytics" ON "public"."product_analytics" FOR SELECT USING (("product_id" IN ( SELECT "products"."id"
   FROM "public"."products"
  WHERE ("products"."vendor_name" = ("auth"."jwt"() ->> 'email'::"text")))));



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."line_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."otp_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."customers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."otp_tokens";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."shopify_customers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."users";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






























































































































































































































































































































GRANT ALL ON FUNCTION "public"."calculate_edition_numbers"("product_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_edition_numbers"("product_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_edition_numbers"("product_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_orphaned_products"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_products"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_products"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_policy_if_not_exists"("policy_name" "text", "table_name" "text", "action" "text", "roles" "text", "using_expr" "text", "with_check_expr" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_policy_if_not_exists"("policy_name" "text", "table_name" "text", "action" "text", "roles" "text", "using_expr" "text", "with_check_expr" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_policy_if_not_exists"("policy_name" "text", "table_name" "text", "action" "text", "roles" "text", "using_expr" "text", "with_check_expr" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."exec_sql"("sql_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."exec_sql"("sql_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."exec_sql"("sql_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."resequence_edition_numbers"("product_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."resequence_edition_numbers"("product_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resequence_edition_numbers"("product_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."scheduled_cleanup"() TO "anon";
GRANT ALL ON FUNCTION "public"."scheduled_cleanup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."scheduled_cleanup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."setup_cleanup_schedule"() TO "anon";
GRANT ALL ON FUNCTION "public"."setup_cleanup_schedule"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."setup_cleanup_schedule"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_all_products"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_all_products"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_all_products"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_products"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_products"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_products"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



























GRANT ALL ON TABLE "public"."benefit_types" TO "anon";
GRANT ALL ON TABLE "public"."benefit_types" TO "authenticated";
GRANT ALL ON TABLE "public"."benefit_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."benefit_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."benefit_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."benefit_types_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."certificate_access_logs" TO "anon";
GRANT ALL ON TABLE "public"."certificate_access_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."certificate_access_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."certificate_access_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."certificate_access_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."certificate_access_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."collector_benefit_claims" TO "anon";
GRANT ALL ON TABLE "public"."collector_benefit_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."collector_benefit_claims" TO "service_role";



GRANT ALL ON SEQUENCE "public"."collector_benefit_claims_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."collector_benefit_claims_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."collector_benefit_claims_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_media_cache" TO "anon";
GRANT ALL ON TABLE "public"."instagram_media_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_media_cache" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_profile_cache" TO "anon";
GRANT ALL ON TABLE "public"."instagram_profile_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_profile_cache" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_stories_cache" TO "anon";
GRANT ALL ON TABLE "public"."instagram_stories_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_stories_cache" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_story_views" TO "anon";
GRANT ALL ON TABLE "public"."instagram_story_views" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_story_views" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_vendors" TO "anon";
GRANT ALL ON TABLE "public"."instagram_vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_vendors" TO "service_role";



GRANT ALL ON TABLE "public"."line_items" TO "anon";
GRANT ALL ON TABLE "public"."line_items" TO "authenticated";
GRANT ALL ON TABLE "public"."line_items" TO "service_role";



GRANT ALL ON TABLE "public"."nfc_tags" TO "anon";
GRANT ALL ON TABLE "public"."nfc_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."nfc_tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."nfc_tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."nfc_tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."nfc_tags_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."order_line_items" TO "anon";
GRANT ALL ON TABLE "public"."order_line_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_line_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_line_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_line_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_line_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."otp_tokens" TO "anon";
GRANT ALL ON TABLE "public"."otp_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."otp_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."product_analytics" TO "anon";
GRANT ALL ON TABLE "public"."product_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."product_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."product_benefits" TO "anon";
GRANT ALL ON TABLE "public"."product_benefits" TO "authenticated";
GRANT ALL ON TABLE "public"."product_benefits" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_benefits_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_benefits_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_benefits_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."product_edition_counters" TO "anon";
GRANT ALL ON TABLE "public"."product_edition_counters" TO "authenticated";
GRANT ALL ON TABLE "public"."product_edition_counters" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_edition_counters_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_edition_counters_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_edition_counters_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."product_vendor_payouts" TO "anon";
GRANT ALL ON TABLE "public"."product_vendor_payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."product_vendor_payouts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_vendor_payouts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_vendor_payouts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_vendor_payouts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."shopify_customers" TO "anon";
GRANT ALL ON TABLE "public"."shopify_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."shopify_customers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."shopify_customers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."shopify_customers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."shopify_customers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sync_logs" TO "anon";
GRANT ALL ON TABLE "public"."sync_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sync_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sync_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sync_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sync_status" TO "anon";
GRANT ALL ON TABLE "public"."sync_status" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_status" TO "service_role";



GRANT ALL ON TABLE "public"."transfer_history" TO "anon";
GRANT ALL ON TABLE "public"."transfer_history" TO "authenticated";
GRANT ALL ON TABLE "public"."transfer_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transfer_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transfer_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transfer_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_shopify_connections" TO "anon";
GRANT ALL ON TABLE "public"."user_shopify_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."user_shopify_connections" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_shopify_connections_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_shopify_connections_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_shopify_connections_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_payouts" TO "anon";
GRANT ALL ON TABLE "public"."vendor_payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_payouts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vendor_payouts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vendor_payouts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vendor_payouts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vendors_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vendors_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vendors_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."webhook_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."webhook_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."webhook_logs_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
