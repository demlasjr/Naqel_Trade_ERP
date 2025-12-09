-- Enable Realtime for key tables
-- Run this in Supabase SQL Editor

-- Enable realtime for sales_orders
ALTER PUBLICATION supabase_realtime ADD TABLE sales_orders;

-- Enable realtime for purchase_orders
ALTER PUBLICATION supabase_realtime ADD TABLE purchase_orders;

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- Enable realtime for products
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Enable realtime for accounts
ALTER PUBLICATION supabase_realtime ADD TABLE accounts;

-- Enable realtime for activity_logs
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;

-- Enable realtime for customers
ALTER PUBLICATION supabase_realtime ADD TABLE customers;

-- Enable realtime for vendors
ALTER PUBLICATION supabase_realtime ADD TABLE vendors;

-- Note: You can also enable this via Supabase Dashboard:
-- 1. Go to Database > Replication
-- 2. Enable realtime for each table you want to subscribe to

