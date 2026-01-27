-- RBAC System: Update RLS Policies
-- Updates existing RLS policies to use the new public.has_role() function with JWT claims
-- Date: 2026-01-26

-- ============================================
-- 1. Update Vendor Data Policies
-- ============================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Vendors can access their own data" ON public.vendors;
DROP POLICY IF EXISTS "Admins can access all vendors" ON public.vendors;

-- Create new policies using JWT claims
CREATE POLICY "Vendors can access their own data"
  ON public.vendors
  FOR ALL
  USING (
    -- Vendor can access their own data
    public.has_role('vendor') AND id = public.jwt_vendor_id()
  );

CREATE POLICY "Admins can access all vendors"
  ON public.vendors
  FOR ALL
  USING (public.has_role('admin'));

-- ============================================
-- 2. Update Vendor Messages Policies
-- ============================================

DROP POLICY IF EXISTS "Vendors can view their own messages" ON public.vendor_messages;
DROP POLICY IF EXISTS "Vendors can create messages" ON public.vendor_messages;
DROP POLICY IF EXISTS "Vendors can update their messages" ON public.vendor_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.vendor_messages;

CREATE POLICY "Vendors can view their own messages"
  ON public.vendor_messages
  FOR SELECT
  USING (
    public.has_role('vendor') AND 
    vendor_name IN (
      SELECT v.vendor_name 
      FROM public.vendors v
      WHERE v.id = public.jwt_vendor_id()
    )
  );

CREATE POLICY "Vendors can create messages"
  ON public.vendor_messages
  FOR INSERT
  WITH CHECK (
    public.has_role('vendor') AND 
    vendor_name IN (
      SELECT v.vendor_name 
      FROM public.vendors v
      WHERE v.id = public.jwt_vendor_id()
    )
  );

CREATE POLICY "Vendors can update their messages"
  ON public.vendor_messages
  FOR UPDATE
  USING (
    public.has_role('vendor') AND 
    vendor_name IN (
      SELECT v.vendor_name 
      FROM public.vendors v
      WHERE v.id = public.jwt_vendor_id()
    )
  );

CREATE POLICY "Admins can manage all messages"
  ON public.vendor_messages
  FOR ALL
  USING (public.has_role('admin'));

-- ============================================
-- 3. Update Vendor Notifications Policies
-- ============================================

DROP POLICY IF EXISTS "Vendors can view their notifications" ON public.vendor_notifications;
DROP POLICY IF EXISTS "Vendors can update their notifications" ON public.vendor_notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.vendor_notifications;

CREATE POLICY "Vendors can view their notifications"
  ON public.vendor_notifications
  FOR SELECT
  USING (
    public.has_role('vendor') AND 
    vendor_name IN (
      SELECT v.vendor_name 
      FROM public.vendors v
      WHERE v.id = public.jwt_vendor_id()
    )
  );

CREATE POLICY "Vendors can update their notifications"
  ON public.vendor_notifications
  FOR UPDATE
  USING (
    public.has_role('vendor') AND 
    vendor_name IN (
      SELECT v.vendor_name 
      FROM public.vendors v
      WHERE v.id = public.jwt_vendor_id()
    )
  );

CREATE POLICY "Admins can manage all notifications"
  ON public.vendor_notifications
  FOR ALL
  USING (public.has_role('admin'));

-- ============================================
-- 4. Update Order Line Items Policies
-- ============================================

DROP POLICY IF EXISTS "Collectors can view their own items" ON public.order_line_items_v2;
DROP POLICY IF EXISTS "Vendors can view their items" ON public.order_line_items_v2;
DROP POLICY IF EXISTS "Admins can view all items" ON public.order_line_items_v2;

CREATE POLICY "Collectors can view their own items"
  ON public.order_line_items_v2
  FOR SELECT
  USING (
    public.has_role('collector') AND 
    (
      owner_id = auth.uid() OR
      LOWER(owner_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

CREATE POLICY "Vendors can view their items"
  ON public.order_line_items_v2
  FOR SELECT
  USING (
    public.has_role('vendor') AND 
    vendor_name IN (
      SELECT v.vendor_name 
      FROM public.vendors v
      WHERE v.id = public.jwt_vendor_id()
    )
  );

CREATE POLICY "Admins can manage all items"
  ON public.order_line_items_v2
  FOR ALL
  USING (public.has_role('admin'));

-- ============================================
-- 5. Update Collector Profiles Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.collector_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.collector_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.collector_profiles;

CREATE POLICY "Collectors can view their own profile"
  ON public.collector_profiles
  FOR SELECT
  USING (
    public.has_role('collector') AND user_id = auth.uid()
  );

CREATE POLICY "Collectors can update their own profile"
  ON public.collector_profiles
  FOR UPDATE
  USING (
    public.has_role('collector') AND user_id = auth.uid()
  );

CREATE POLICY "Collectors can insert their own profile"
  ON public.collector_profiles
  FOR INSERT
  WITH CHECK (
    public.has_role('collector') AND user_id = auth.uid()
  );

CREATE POLICY "Admins can manage all profiles"
  ON public.collector_profiles
  FOR ALL
  USING (public.has_role('admin'));

-- ============================================
-- 6. Update Products Policies
-- ============================================

DROP POLICY IF EXISTS "Vendors can view their products" ON public.products;
DROP POLICY IF EXISTS "Vendors can manage their products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Public can view published products" ON public.products;

CREATE POLICY "Vendors can view their products"
  ON public.products
  FOR SELECT
  USING (
    public.has_role('vendor') AND 
    vendor_name IN (
      SELECT v.vendor_name 
      FROM public.vendors v
      WHERE v.id = public.jwt_vendor_id()
    )
  );

CREATE POLICY "Vendors can manage their products"
  ON public.products
  FOR ALL
  USING (
    public.has_role('vendor') AND 
    vendor_name IN (
      SELECT v.vendor_name 
      FROM public.vendors v
      WHERE v.id = public.jwt_vendor_id()
    )
  );

CREATE POLICY "Admins can manage all products"
  ON public.products
  FOR ALL
  USING (public.has_role('admin'));

-- Public can view published products (no auth required)
CREATE POLICY "Public can view published products"
  ON public.products
  FOR SELECT
  USING (status = 'active');

-- ============================================
-- 7. Update Journey Map Settings Policies
-- ============================================

-- Check if policies exist before dropping (might not exist in all environments)
DO $$
BEGIN
  DROP POLICY IF EXISTS "allow_all_with_app_auth" ON public.journey_map_settings;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

CREATE POLICY "Vendors can manage their journey settings"
  ON public.journey_map_settings
  FOR ALL
  USING (
    public.has_role('vendor') AND 
    vendor_id = public.jwt_vendor_id()
  );

CREATE POLICY "Admins can manage all journey settings"
  ON public.journey_map_settings
  FOR ALL
  USING (public.has_role('admin'));

-- ============================================
-- 8. Update Series Completion History Policies
-- ============================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "allow_all_with_app_auth" ON public.series_completion_history;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

CREATE POLICY "Collectors can view their completion history"
  ON public.series_completion_history
  FOR SELECT
  USING (
    public.has_role('collector') AND user_id = auth.uid()
  );

CREATE POLICY "Collectors can manage their completion history"
  ON public.series_completion_history
  FOR ALL
  USING (
    public.has_role('collector') AND user_id = auth.uid()
  );

CREATE POLICY "Admins can view all completion history"
  ON public.series_completion_history
  FOR SELECT
  USING (public.has_role('admin'));

-- ============================================
-- 9. Update Artwork Series Policies
-- ============================================

DROP POLICY IF EXISTS "Vendors can manage their series" ON public.artwork_series;
DROP POLICY IF EXISTS "Collectors can view unlocked series" ON public.artwork_series;
DROP POLICY IF EXISTS "Public can view published series" ON public.artwork_series;

CREATE POLICY "Vendors can manage their series"
  ON public.artwork_series
  FOR ALL
  USING (
    public.has_role('vendor') AND 
    vendor_name IN (
      SELECT v.vendor_name 
      FROM public.vendors v
      WHERE v.id = public.jwt_vendor_id()
    )
  );

CREATE POLICY "Collectors can view series"
  ON public.artwork_series
  FOR SELECT
  USING (
    public.has_role('collector') OR
    public.has_role('admin') OR
    is_published = true
  );

CREATE POLICY "Admins can manage all series"
  ON public.artwork_series
  FOR ALL
  USING (public.has_role('admin'));

-- ============================================
-- 10. Update Orders Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can view orders with their products" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

CREATE POLICY "Collectors can view their own orders"
  ON public.orders
  FOR SELECT
  USING (
    public.has_role('collector') AND
    (
      customer_id = auth.uid()::text OR
      LOWER(customer_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

CREATE POLICY "Vendors can view orders with their products"
  ON public.orders
  FOR SELECT
  USING (
    public.has_role('vendor') AND 
    id IN (
      SELECT DISTINCT order_id
      FROM public.order_line_items_v2
      WHERE vendor_name IN (
        SELECT v.vendor_name 
        FROM public.vendors v
        WHERE v.id = public.jwt_vendor_id()
      )
    )
  );

CREATE POLICY "Admins can manage all orders"
  ON public.orders
  FOR ALL
  USING (public.has_role('admin'));

-- ============================================
-- 11. Summary Comments
-- ============================================

COMMENT ON FUNCTION public.has_role IS 
  'Check if current user JWT contains specified role. Used in RLS policies for role-based access control.';

COMMENT ON FUNCTION public.jwt_vendor_id IS
  'Extract vendor_id from current user JWT claims. Returns NULL if not a vendor.';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '================================';
  RAISE NOTICE 'RLS Policies Updated';
  RAISE NOTICE '================================';
  RAISE NOTICE 'All RLS policies have been updated to use JWT-based role checking';
  RAISE NOTICE 'Policies now use public.has_role() and public.jwt_vendor_id()';
  RAISE NOTICE '================================';
END $$;
