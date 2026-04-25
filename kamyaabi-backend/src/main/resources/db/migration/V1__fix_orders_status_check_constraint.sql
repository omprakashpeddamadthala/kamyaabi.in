-- Fix orders_status_check constraint to include all current OrderStatus enum values.
--
-- Background:
--   Hibernate (with `ddl-auto: update`) auto-generated this CHECK constraint on
--   first boot from the enum values that existed at that time. When new enum
--   values were added later (e.g. PAID, PAYMENT_FAILED, PROCESSING), Hibernate's
--   `update` mode does NOT re-sync existing CHECK constraints, so the stale
--   constraint kept rejecting the new values — most visibly causing payment
--   verification to fail with a DataIntegrityViolationException when setting
--   order status to PAID.
--
-- Fix:
--   Drop the stale auto-generated constraint and recreate it with the full,
--   current set of OrderStatus values (see com.kamyaabi.entity.Order.OrderStatus).
--   This is backward-compatible: every previously valid value is still valid.

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN (
        'PENDING',
        'PAID',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'PAYMENT_FAILED'
    ));
