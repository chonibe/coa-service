-- Migration: Add unique constraint to line_item_id
-- This allows upsert operations to work correctly

ALTER TABLE public.order_line_items_v2 ADD CONSTRAINT order_line_items_v2_line_item_id_key UNIQUE (line_item_id);

