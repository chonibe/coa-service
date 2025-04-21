-- Add vendor_id and payout_price columns to the products table
ALTER TABLE products ADD COLUMN vendor_id VARCHAR(255);
ALTER TABLE products ADD COLUMN payout_price DECIMAL(10, 2) DEFAULT 0.00;
