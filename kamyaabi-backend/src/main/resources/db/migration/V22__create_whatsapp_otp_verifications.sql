-- V22: WhatsApp OTP verifications — short-lived store of hashed OTP codes for
-- the ChatMitra-powered WhatsApp login/signup flow. Previously created only via
-- Hibernate ddl-auto; this migration makes the schema explicit on Postgres.
-- Also seeds the ChatMitra integration settings so admins can configure them
-- under Admin → Settings.

CREATE TABLE IF NOT EXISTS whatsapp_otp_verifications (
    id                 BIGSERIAL PRIMARY KEY,
    phone_number       VARCHAR(32)  NOT NULL,
    otp_hash           VARCHAR(255) NOT NULL,
    purpose            VARCHAR(32)  NOT NULL,
    expires_at         TIMESTAMP    NOT NULL,
    attempt_count      INTEGER      NOT NULL DEFAULT 0,
    max_attempts       INTEGER      NOT NULL DEFAULT 3,
    verified           BOOLEAN      NOT NULL DEFAULT FALSE,
    verified_at        TIMESTAMP,
    revoked_at         TIMESTAMP,
    requested_from_ip  VARCHAR(64),
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_otp_phone_active
    ON whatsapp_otp_verifications(phone_number, expires_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_otp_ip_created
    ON whatsapp_otp_verifications(requested_from_ip, created_at);

INSERT INTO settings ("key", "value", updated_at)
VALUES
    ('whatsapp_otp_auth_enabled',   'false',                                          CURRENT_TIMESTAMP),
    ('chatmitra_api_token',         '',                                               CURRENT_TIMESTAMP),
    ('chatmitra_api_base_url',      'https://backend.chatmitra.com/developer/api',    CURRENT_TIMESTAMP),
    ('chatmitra_sender_id',         '',                                               CURRENT_TIMESTAMP),
    ('chatmitra_otp_template_id',   'otp_login',                                      CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
