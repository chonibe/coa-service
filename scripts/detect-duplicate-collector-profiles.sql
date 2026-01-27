-- Detect Duplicate Collector Profiles by Shopify Customer ID
-- Run this query to identify all shopify_customer_id values with multiple profiles

-- Find duplicates with details
SELECT 
    shopify_customer_id,
    COUNT(*) as profile_count,
    ARRAY_AGG(id ORDER BY created_at) as profile_ids,
    ARRAY_AGG(email ORDER BY created_at) as emails,
    ARRAY_AGG(user_id ORDER BY created_at) as user_ids,
    ARRAY_AGG(created_at ORDER BY created_at) as creation_dates,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM collector_profiles
WHERE shopify_customer_id IS NOT NULL
GROUP BY shopify_customer_id
HAVING COUNT(*) > 1
ORDER BY profile_count DESC, first_created ASC;

-- Summary statistics
SELECT 
    COUNT(DISTINCT shopify_customer_id) as duplicate_shopify_ids,
    SUM(profile_count - 1) as extra_profiles_to_merge
FROM (
    SELECT 
        shopify_customer_id,
        COUNT(*) as profile_count
    FROM collector_profiles
    WHERE shopify_customer_id IS NOT NULL
    GROUP BY shopify_customer_id
    HAVING COUNT(*) > 1
) duplicates;

-- Detailed view with order counts
SELECT 
    cp.shopify_customer_id,
    cp.id as profile_id,
    cp.email,
    cp.user_id,
    cp.created_at,
    COUNT(DISTINCT o.id) as order_count,
    COUNT(DISTINCT oli.id) as line_item_count
FROM collector_profiles cp
LEFT JOIN orders o ON o.shopify_customer_id = cp.shopify_customer_id
LEFT JOIN order_line_items_v2 oli ON oli.order_id = o.id
WHERE cp.shopify_customer_id IN (
    SELECT shopify_customer_id
    FROM collector_profiles
    WHERE shopify_customer_id IS NOT NULL
    GROUP BY shopify_customer_id
    HAVING COUNT(*) > 1
)
GROUP BY cp.shopify_customer_id, cp.id, cp.email, cp.user_id, cp.created_at
ORDER BY cp.shopify_customer_id, cp.created_at;
