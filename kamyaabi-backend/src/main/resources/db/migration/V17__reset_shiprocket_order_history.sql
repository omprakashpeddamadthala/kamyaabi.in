-- V17: Clear pre-cutover order history so Shiprocket admin reporting starts fresh.
TRUNCATE TABLE coupon_usages RESTART IDENTITY CASCADE;
TRUNCATE TABLE payments RESTART IDENTITY CASCADE;
TRUNCATE TABLE order_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE orders RESTART IDENTITY CASCADE;

SELECT setval(pg_get_serial_sequence('orders', 'id'), 999, true);
