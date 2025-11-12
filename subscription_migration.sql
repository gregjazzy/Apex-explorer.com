ALTER TABLE explorers 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_subscription_status ON explorers(subscription_status);

COMMENT ON COLUMN explorers.subscription_status IS 'free | trial | premium';
COMMENT ON COLUMN explorers.subscription_expires_at IS 'Date expiration pour trial (NULL si premium)';

CREATE TABLE IF NOT EXISTS activation_codes (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activation_code ON activation_codes(code);

ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous peuvent verifier codes"
ON activation_codes FOR SELECT
USING (true);

CREATE POLICY "Seuls admins creent codes"
ON activation_codes FOR INSERT
USING (false);

