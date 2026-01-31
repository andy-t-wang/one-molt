-- WorldID-Integrated Identity Proof System Database Schema
-- This schema supports registration of devices with WorldID proof-of-personhood
-- and verification of Ed25519 signatures

-- ============================================================================
-- Table: registrations
-- Stores verified device registrations with WorldID proof
-- ============================================================================
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- OpenClaw Identity
  device_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,

  -- WorldID Proof
  nullifier_hash TEXT UNIQUE NOT NULL,
  merkle_root TEXT NOT NULL,
  verification_level TEXT NOT NULL,  -- 'orb', 'device', 'face', etc.

  -- Registration Metadata
  registration_signature TEXT NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Status
  verified BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  ip_address INET,
  user_agent TEXT,

  -- Constraints
  CONSTRAINT unique_device_id UNIQUE(device_id),
  CONSTRAINT unique_nullifier_hash UNIQUE(nullifier_hash)
);

-- Indexes for efficient lookups
CREATE INDEX idx_registrations_public_key ON registrations(public_key);
CREATE INDEX idx_registrations_device_id ON registrations(device_id);
CREATE INDEX idx_registrations_nullifier_hash ON registrations(nullifier_hash);
CREATE INDEX idx_registrations_verified ON registrations(verified, active);

-- ============================================================================
-- Table: registration_sessions
-- Temporary sessions for the registration flow
-- ============================================================================
CREATE TABLE registration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,

  -- Pending Registration
  device_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  signature TEXT NOT NULL,
  message TEXT NOT NULL,

  -- WorldID Proof (populated later)
  worldid_proof JSONB,

  -- Session Management
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'worldid_verified', 'completed', 'expired'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),

  -- Audit
  ip_address INET,
  user_agent TEXT,

  -- Constraints
  CONSTRAINT unique_session_token UNIQUE(session_token),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'worldid_verified', 'completed', 'expired', 'failed'))
);

-- Indexes
CREATE INDEX idx_sessions_token ON registration_sessions(session_token);
CREATE INDEX idx_sessions_status ON registration_sessions(status);
CREATE INDEX idx_sessions_expires ON registration_sessions(expires_at);
CREATE INDEX idx_sessions_device_id ON registration_sessions(device_id);

-- Auto-cleanup expired sessions function
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE registration_sessions
  SET status = 'expired'
  WHERE expires_at < NOW() AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Table: verification_logs
-- Audit trail for all verification attempts
-- ============================================================================
CREATE TABLE verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request Details
  device_id TEXT NOT NULL,
  public_key TEXT,
  message TEXT NOT NULL,
  signature TEXT NOT NULL,

  -- Verification Result
  verified BOOLEAN NOT NULL,
  verification_method TEXT NOT NULL,  -- 'signature', 'worldid', 'both'

  -- Metadata
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,

  -- Foreign Key (optional reference)
  registration_id UUID REFERENCES registrations(id)
);

-- Indexes
CREATE INDEX idx_logs_device_id ON verification_logs(device_id);
CREATE INDEX idx_logs_timestamp ON verification_logs(timestamp DESC);
CREATE INDEX idx_logs_verified ON verification_logs(verified);
CREATE INDEX idx_logs_registration_id ON verification_logs(registration_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for verified and active registrations
CREATE POLICY "Public read verified registrations" ON registrations
  FOR SELECT USING (verified = true AND active = true);

-- Session access (API handles auth via session token)
CREATE POLICY "Public session read" ON registration_sessions
  FOR SELECT USING (true);

CREATE POLICY "Public session insert" ON registration_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public session update" ON registration_sessions
  FOR UPDATE USING (true);

-- Logs are append-only, public can insert
CREATE POLICY "Public append logs" ON verification_logs
  FOR INSERT WITH CHECK (true);

-- Public can read logs (for transparency)
CREATE POLICY "Public read logs" ON verification_logs
  FOR SELECT USING (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to check if a device is registered and verified
CREATE OR REPLACE FUNCTION is_device_registered(p_device_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM registrations
    WHERE device_id = p_device_id
      AND verified = true
      AND active = true
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get public key by device ID
CREATE OR REPLACE FUNCTION get_public_key(p_device_id TEXT)
RETURNS TEXT AS $$
DECLARE
  v_public_key TEXT;
BEGIN
  SELECT public_key INTO v_public_key
  FROM registrations
  WHERE device_id = p_device_id
    AND verified = true
    AND active = true;

  RETURN v_public_key;
END;
$$ LANGUAGE plpgsql;

-- Function to check if nullifier hash is already used
CREATE OR REPLACE FUNCTION is_nullifier_used(p_nullifier_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM registrations
    WHERE nullifier_hash = p_nullifier_hash
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE registrations IS 'Verified device registrations with WorldID proof-of-personhood';
COMMENT ON TABLE registration_sessions IS 'Temporary sessions for the two-step registration flow';
COMMENT ON TABLE verification_logs IS 'Audit trail for all signature verification attempts';

COMMENT ON COLUMN registrations.device_id IS 'Unique device identifier (SHA256 hash of public key)';
COMMENT ON COLUMN registrations.public_key IS 'Ed25519 public key in base64 DER format';
COMMENT ON COLUMN registrations.nullifier_hash IS 'WorldID nullifier hash (prevents duplicate registrations)';
COMMENT ON COLUMN registrations.verification_level IS 'WorldID verification level (orb, device, face)';

COMMENT ON COLUMN registration_sessions.session_token IS 'Unique session token for registration URL';
COMMENT ON COLUMN registration_sessions.expires_at IS 'Session expiration time (15 minutes from creation)';
