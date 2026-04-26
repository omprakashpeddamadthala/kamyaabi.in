-- ============================================================
-- PHASE 2 + 3: Reset transactional data (keep products/categories)
--              and set orders auto-increment to start at 1000
-- ============================================================

-- Disable foreign key checks temporarily (Postgres uses TRUNCATE CASCADE)
-- Order matters: children before parents

-- 1. Clear payments (references orders)
TRUNCATE TABLE payments RESTART IDENTITY CASCADE;

-- 2. Clear order_items (references orders + products)
TRUNCATE TABLE order_items RESTART IDENTITY CASCADE;

-- 3. Clear orders (references users + addresses)
TRUNCATE TABLE orders RESTART IDENTITY CASCADE;

-- 4. Clear cart_items (references carts + products)
TRUNCATE TABLE cart_items RESTART IDENTITY CASCADE;

-- 5. Clear carts (references users)
TRUNCATE TABLE carts RESTART IDENTITY CASCADE;

-- 6. Clear addresses (references users)
TRUNCATE TABLE addresses RESTART IDENTITY CASCADE;

-- 7. Clear users last (everything else already cleared)
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- ============================================================
-- PHASE 3: Set orders sequence to start at 1000
-- ============================================================
-- After TRUNCATE RESTART IDENTITY, the sequence is reset to 1.
-- We alter it to start at 1000 so the first new order gets ID 1000.

-- Find the sequence name used by orders.id and restart at 1000
SELECT setval(pg_get_serial_sequence('orders', 'id'), 999, true);

-- Verify (optional sanity check — comment out if causing issues in Flyway)
-- SELECT last_value FROM orders_id_seq;
