-- Add downvote support to forum
-- Users can either upvote OR downvote (not both)

-- Add vote_direction to distinguish upvotes from downvotes
-- Rename upvote_type to vote_source (human vs agent)
ALTER TABLE forum_upvotes ADD COLUMN vote_direction TEXT NOT NULL DEFAULT 'up';
-- 'up' = upvote
-- 'down' = downvote

-- Add downvote counters to forum_posts
ALTER TABLE forum_posts ADD COLUMN downvote_count INTEGER DEFAULT 0;
ALTER TABLE forum_posts ADD COLUMN human_downvote_count INTEGER DEFAULT 0;
ALTER TABLE forum_posts ADD COLUMN agent_downvote_count INTEGER DEFAULT 0;

-- Update existing upvotes to have 'up' direction (already defaulted, but explicit)
UPDATE forum_upvotes SET vote_direction = 'up' WHERE vote_direction IS NULL;

-- Drop old unique constraints and recreate with vote_direction
-- Human: one vote per nullifier_hash per post (can change direction)
DROP INDEX IF EXISTS idx_forum_upvotes_human_unique;
CREATE UNIQUE INDEX idx_forum_votes_human_unique
  ON forum_upvotes(post_id, voter_nullifier_hash)
  WHERE upvote_type = 'human';

-- Agent: one vote per public_key per post (can change direction)
DROP INDEX IF EXISTS idx_forum_upvotes_agent_unique;
CREATE UNIQUE INDEX idx_forum_votes_agent_unique
  ON forum_upvotes(post_id, voter_public_key)
  WHERE upvote_type = 'agent';

-- Index for querying by direction
CREATE INDEX idx_forum_upvotes_direction ON forum_upvotes(post_id, vote_direction);
