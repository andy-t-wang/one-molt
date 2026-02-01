-- Migration: Create twitter_claims table for Twitter handle verification
-- Links nullifier hashes to verified Twitter handles

CREATE TABLE IF NOT EXISTS twitter_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nullifier_hash TEXT NOT NULL UNIQUE,
  twitter_handle TEXT NOT NULL,
  tweet_url TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for looking up claims by Twitter handle
CREATE INDEX IF NOT EXISTS idx_twitter_claims_handle ON twitter_claims(twitter_handle);

-- Index for looking up by nullifier
CREATE INDEX IF NOT EXISTS idx_twitter_claims_nullifier ON twitter_claims(nullifier_hash);

-- Enable RLS
ALTER TABLE twitter_claims ENABLE ROW LEVEL SECURITY;

-- Public can read all claims (for leaderboard)
CREATE POLICY "twitter_claims_select_public"
  ON twitter_claims FOR SELECT
  USING (true);

-- Block direct writes (API uses service role)
CREATE POLICY "twitter_claims_insert_blocked"
  ON twitter_claims FOR INSERT
  WITH CHECK (false);

CREATE POLICY "twitter_claims_update_blocked"
  ON twitter_claims FOR UPDATE
  USING (false);

CREATE POLICY "twitter_claims_delete_blocked"
  ON twitter_claims FOR DELETE
  USING (false);
