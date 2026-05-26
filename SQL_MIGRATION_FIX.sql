-- ============================================
-- QUICK FIX: Add missing columns to audit_chain
-- ============================================
-- Run these commands in Supabase SQL Editor to fix schema mismatch

-- Add missing columns to audit_chain table
ALTER TABLE audit_chain
ADD COLUMN IF NOT EXISTS entry_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS agent_id TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dilithium_signature TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Create index for created_at (used in select order by)
CREATE INDEX IF NOT EXISTS idx_audit_chain_created_at ON audit_chain(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_chain_entry_id ON audit_chain(entry_id);
CREATE INDEX IF NOT EXISTS idx_audit_chain_agent_id ON audit_chain(agent_id);

-- ============================================
-- Fix agents table if needed
-- ============================================

-- Check if agents table exists and add created_at if missing
ALTER TABLE agent_identities
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Create index for agents
CREATE INDEX IF NOT EXISTS idx_agent_identities_created_at ON agent_identities(created_at);

-- ============================================
-- Verify table structure
-- ============================================
-- After running above, check table structure with:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'audit_chain' ORDER BY ordinal_position;
