-- Add user status column for admin block/unblock workflow.
-- Existing users default to ACTIVE.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS status VARCHAR(16);

UPDATE users SET status = 'ACTIVE' WHERE status IS NULL;

ALTER TABLE users
    ALTER COLUMN status SET NOT NULL;

ALTER TABLE users
    ADD CONSTRAINT users_status_check
        CHECK (status IN ('ACTIVE', 'BLOCKED'));
