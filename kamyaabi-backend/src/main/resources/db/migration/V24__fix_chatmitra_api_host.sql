-- V24: The public ChatMitra docs advertise host api.chatmitra.com, but that
-- hostname has no DNS record and is unreachable (I/O error on send). The live
-- API server is backend.chatmitra.com. V23 had pointed the setting at the
-- documented-but-dead host; repoint it at the reachable host, keeping the
-- documented /v2/client path. Only rewrite rows still holding the V23 value so
-- a value an admin set by hand is preserved.

UPDATE settings
SET "value" = 'https://backend.chatmitra.com/v2/client',
    updated_at = CURRENT_TIMESTAMP
WHERE "key" = 'chatmitra_api_base_url'
  AND "value" = 'https://api.chatmitra.com/v2/client';
