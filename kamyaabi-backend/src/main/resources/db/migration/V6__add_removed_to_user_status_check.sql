-- Widen the users_status_check constraint to include the REMOVED value
-- added to User.Status in the soft-delete feature.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;

ALTER TABLE users
    ADD CONSTRAINT users_status_check
        CHECK (status IN ('ACTIVE', 'BLOCKED', 'REMOVED'));
