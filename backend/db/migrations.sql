-- =========================================================
-- CRANE C3 C4 C7 + SNAKE S1-S7 SUPABASE TABLES
-- =========================================================
-- Execute these SQL statements in Supabase SQL Editor to create tables

-- =========================================================
-- C3 APPROVERS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS approvers (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  dilithium_public_key TEXT NOT NULL,
  sector_permissions TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approvers_role ON approvers(role);
CREATE INDEX IF NOT EXISTS idx_approvers_active ON approvers(is_active);

-- =========================================================
-- C3 PENDING ACTIONS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS pending_actions (
  task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  sector TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  risk_score FLOAT DEFAULT 0,
  required_approvals INT DEFAULT 2,
  current_approvals INT DEFAULT 0,
  trust_score FLOAT DEFAULT 100,
  tribunal_result JSONB,
  execution_status TEXT DEFAULT 'PENDING_APPROVAL',
  payload JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_actions_status ON pending_actions(execution_status);
CREATE INDEX IF NOT EXISTS idx_pending_actions_agent ON pending_actions(agent_id);
CREATE INDEX IF NOT EXISTS idx_pending_actions_expires ON pending_actions(expires_at);

-- =========================================================
-- C3 ACTION APPROVALS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS action_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES pending_actions(task_id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES approvers(user_id) ON DELETE CASCADE,
  signature TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_action_approvals_task ON action_approvals(task_id);
CREATE INDEX IF NOT EXISTS idx_action_approvals_approver ON action_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_action_approvals_verified ON action_approvals(verified);

-- =========================================================
-- C4 POLICY LOGS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS policy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  sector TEXT,
  sqa_decision TEXT NOT NULL,
  armoriq_decision TEXT NOT NULL,
  armoriq_action TEXT,
  armoriq_reason TEXT,
  final_decision TEXT NOT NULL,
  risk_score FLOAT,
  trust_score FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policy_logs_agent ON policy_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_policy_logs_action ON policy_logs(action);
CREATE INDEX IF NOT EXISTS idx_policy_logs_decision ON policy_logs(final_decision);
CREATE INDEX IF NOT EXISTS idx_policy_logs_created ON policy_logs(created_at);

-- =========================================================
-- C7 TRIBUNAL LOGS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS tribunal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  decision TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  feature_importance JSONB NOT NULL,
  gemini_explanation TEXT,
  shap_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tribunal_logs_agent ON tribunal_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_tribunal_logs_decision ON tribunal_logs(decision);
CREATE INDEX IF NOT EXISTS idx_tribunal_logs_created ON tribunal_logs(created_at);

-- =========================================================
-- SNAKE S1 S3: AUDIT CHAIN PERSISTENCE
-- =========================================================

CREATE TABLE IF NOT EXISTS audit_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id TEXT NOT NULL UNIQUE,
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB,
  current_hash TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  dilithium_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_chain_agent ON audit_chain(agent_id);
CREATE INDEX IF NOT EXISTS idx_audit_chain_hash ON audit_chain(current_hash);

-- =========================================================
-- SNAKE S2: AUDIT SIGNING KEY PERSISTENCE
-- =========================================================

CREATE TABLE IF NOT EXISTS audit_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- SNAKE S6: MERKLE CHECKPOINT PERSISTENCE
-- =========================================================

CREATE TABLE IF NOT EXISTS merkle_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merkle_root TEXT NOT NULL,
  chain_length INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merkle_checkpoints_created ON merkle_checkpoints(created_at);

-- =========================================================
-- ROW LEVEL SECURITY (OPTIONAL)
-- =========================================================

-- Uncomment these if you want to enable RLS

-- ALTER TABLE approvers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pending_actions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE action_approvals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE policy_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tribunal_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_chain ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_keys ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE merkle_checkpoints ENABLE ROW LEVEL SECURITY;
