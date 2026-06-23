-- V23: Correct the ChatMitra API base URL. V22 seeded a placeholder host
-- (https://backend.chatmitra.com/developer/api) that does not exist and returns
-- 404 on /send_template. The real endpoint is https://api.chatmitra.com/v2/client.
-- Only rewrite rows still holding the old default so any value an admin set by
-- hand is preserved.

UPDATE settings
SET "value" = 'https://api.chatmitra.com/v2/client',
    updated_at = CURRENT_TIMESTAMP
WHERE "key" = 'chatmitra_api_base_url'
  AND "value" = 'https://backend.chatmitra.com/developer/api';
