-- ============================================
-- SQA COMPLETE SCHEMA - FINAL VERSION
-- ============================================
-- Run this entire script in Supabase SQL Editor

-- Drop and recreate to ensure clean state
DROP TABLE IF EXISTS integration_logs CASCADE;
DROP TABLE IF EXISTS security_alerts CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS session_tokens CASCADE;
DROP TABLE IF EXISTS system_metrics CASCADE;
DROP TABLE IF EXISTS agent_trust_scores CASCADE;
DROP TABLE IF EXISTS policy_decisions CASCADE;
DROP TABLE IF EXISTS tamper_alerts CASCADE;
DROP TABLE IF EXISTS merkle_checkpoints CASCADE;
DROP TABLE IF EXISTS capability_decisions CASCADE;
DROP TABLE IF EXISTS honeypot_interactions CASCADE;
DROP TABLE IF EXISTS replay_attacks CASCADE;
DROP TABLE IF EXISTS prompt_injections CASCADE;
DROP TABLE IF EXISTS threat_detections CASCADE;
DROP TABLE IF EXISTS agent_signatures CASCADE;
DROP TABLE IF EXISTS agent_identities CASCADE;
DROP TABLE IF EXISTS audit_chain CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS login_audit CASCADE;
DROP TABLE IF EXISTS approved_users CASCADE;
DROP TABLE IF EXISTS access_requests CASCADE;

-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  organization TEXT NOT NULL,
  sector TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expected_usage TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_access_requests_status ON access_requests(status);
CREATE INDEX idx_access_requests_email ON access_requests(email);
CREATE INDEX idx_access_requests_created_at ON access_requests(created_at);

CREATE TABLE approved_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  organization TEXT NOT NULL,
  sector TEXT,
  role TEXT DEFAULT 'analyst',
  temp_password TEXT,
  access_request_id UUID REFERENCES access_requests(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_approved_users_email ON approved_users(email);
CREATE INDEX idx_approved_users_role ON approved_users(role);
CREATE INDEX idx_approved_users_created_at ON approved_users(created_at);

CREATE TABLE login_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  event TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_login_audit_user_email ON login_audit(user_email);
CREATE INDEX idx_login_audit_created_at ON login_audit(created_at);

-- ============================================
-- SECURITY & AUDIT TABLES
-- ============================================

CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'INFO',
  agent_id TEXT,
  user_email TEXT,
  message TEXT,
  blocked_by TEXT,
  detection_module TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_security_events_event_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_agent_id ON security_events(agent_id);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);

CREATE TABLE audit_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT,
  actor_type TEXT DEFAULT 'system',
  resource_type TEXT,
  resource_id TEXT,
  status TEXT DEFAULT 'success',
  previous_state JSONB,
  new_state JSONB,
  current_hash TEXT,
  previous_hash TEXT,
  verification TEXT DEFAULT 'VERIFIED',
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_chain_action ON audit_chain(action);
CREATE INDEX idx_audit_chain_timestamp ON audit_chain(timestamp);
CREATE INDEX idx_audit_chain_verification ON audit_chain(verification);

-- ============================================
-- AGENT & IDENTITY TABLES
-- ============================================

CREATE TABLE agent_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL UNIQUE,
  agent_id TEXT NOT NULL UNIQUE,
  sector TEXT NOT NULL,
  kyber_public_key TEXT,
  dilithium_public_key TEXT,
  status TEXT DEFAULT 'active',
  registration_timestamp TIMESTAMPTZ DEFAULT now(),
  last_activity TIMESTAMPTZ,
  blacklist_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agent_identities_agent_name ON agent_identities(agent_name);
CREATE INDEX idx_agent_identities_agent_id ON agent_identities(agent_id);
CREATE INDEX idx_agent_identities_status ON agent_identities(status);
CREATE INDEX idx_agent_identities_sector ON agent_identities(sector);

CREATE TABLE agent_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  signature_hash TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  verification_status TEXT DEFAULT 'valid',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agent_signatures_agent_id ON agent_signatures(agent_id);
CREATE INDEX idx_agent_signatures_verification_status ON agent_signatures(verification_status);

-- ============================================
-- THREAT DETECTION TABLES
-- ============================================

CREATE TABLE threat_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detection_type TEXT NOT NULL,
  agent_id TEXT,
  confidence FLOAT DEFAULT 0.0,
  risk_score FLOAT DEFAULT 0.0,
  blocked BOOLEAN DEFAULT false,
  detection_module TEXT,
  raw_input TEXT,
  detected_pattern TEXT,
  remediation_action TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_threat_detections_detection_type ON threat_detections(detection_type);
CREATE INDEX idx_threat_detections_agent_id ON threat_detections(agent_id);
CREATE INDEX idx_threat_detections_blocked ON threat_detections(blocked);
CREATE INDEX idx_threat_detections_timestamp ON threat_detections(timestamp);

CREATE TABLE prompt_injections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text TEXT,
  agent_id TEXT,
  injected_payload TEXT,
  detection_confidence FLOAT,
  blocked BOOLEAN DEFAULT true,
  detection_method TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_prompt_injections_agent_id ON prompt_injections(agent_id);
CREATE INDEX idx_prompt_injections_timestamp ON prompt_injections(timestamp);

CREATE TABLE replay_attacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT,
  request_hash TEXT,
  original_timestamp TIMESTAMPTZ,
  replay_timestamp TIMESTAMPTZ,
  blocked BOOLEAN DEFAULT true,
  detection_confidence FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_replay_attacks_agent_id ON replay_attacks(agent_id);
CREATE INDEX idx_replay_attacks_replay_timestamp ON replay_attacks(replay_timestamp);

-- ============================================
-- HONEYPOT TABLE
-- ============================================

CREATE TABLE honeypot_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  honeypot_route TEXT NOT NULL,
  agent_id TEXT,
  ip_address TEXT,
  request_method TEXT,
  request_payload JSONB,
  captured_data TEXT,
  threat_level TEXT DEFAULT 'high',
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_honeypot_interactions_honeypot_route ON honeypot_interactions(honeypot_route);
CREATE INDEX idx_honeypot_interactions_agent_id ON honeypot_interactions(agent_id);
CREATE INDEX idx_honeypot_interactions_timestamp ON honeypot_interactions(timestamp);

-- ============================================
-- CRANE - CAPABILITY DECISIONS
-- ============================================

CREATE TABLE capability_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  capability_requested TEXT NOT NULL,
  decision TEXT NOT NULL,
  confidence FLOAT DEFAULT 0.0,
  reason TEXT,
  decision_factors JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_capability_decisions_agent_id ON capability_decisions(agent_id);
CREATE INDEX idx_capability_decisions_decision ON capability_decisions(decision);
CREATE INDEX idx_capability_decisions_timestamp ON capability_decisions(timestamp);

-- ============================================
-- SNAKE - MERKLE & TAMPER
-- ============================================

CREATE TABLE merkle_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_number INTEGER NOT NULL UNIQUE,
  merkle_root TEXT NOT NULL,
  chain_hash TEXT NOT NULL,
  entry_count INTEGER,
  verified_status TEXT DEFAULT 'verified',
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_merkle_checkpoints_checkpoint_number ON merkle_checkpoints(checkpoint_number);
CREATE INDEX idx_merkle_checkpoints_verified_status ON merkle_checkpoints(verified_status);

CREATE TABLE tamper_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  chain_entry_id TEXT,
  tampered_field TEXT,
  original_hash TEXT,
  current_hash TEXT,
  tamper_detected BOOLEAN DEFAULT true,
  severity TEXT DEFAULT 'critical',
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tamper_alerts_alert_type ON tamper_alerts(alert_type);
CREATE INDEX idx_tamper_alerts_tamper_detected ON tamper_alerts(tamper_detected);
CREATE INDEX idx_tamper_alerts_timestamp ON tamper_alerts(timestamp);

-- ============================================
-- PO - POLICY & ORACLE
-- ============================================

CREATE TABLE policy_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL,
  agent_id TEXT,
  decision TEXT NOT NULL,
  trust_score FLOAT DEFAULT 0.0,
  reasoning TEXT,
  decision_metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_policy_decisions_policy_name ON policy_decisions(policy_name);
CREATE INDEX idx_policy_decisions_agent_id ON policy_decisions(agent_id);
CREATE INDEX idx_policy_decisions_decision ON policy_decisions(decision);

CREATE TABLE agent_trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL UNIQUE,
  trust_score FLOAT NOT NULL DEFAULT 50.0,
  risk_indicators JSONB,
  behavior_analysis JSONB,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agent_trust_scores_agent_id ON agent_trust_scores(agent_id);
CREATE INDEX idx_agent_trust_scores_trust_score ON agent_trust_scores(trust_score);

-- ============================================
-- SYSTEM & METRICS
-- ============================================

CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value FLOAT,
  metric_type TEXT,
  tags JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_system_metrics_metric_name ON system_metrics(metric_name);
CREATE INDEX idx_system_metrics_timestamp ON system_metrics(timestamp);

CREATE TABLE session_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked BOOLEAN DEFAULT false
);

CREATE INDEX idx_session_tokens_user_email ON session_tokens(user_email);
CREATE INDEX idx_session_tokens_expires_at ON session_tokens(expires_at);
CREATE INDEX idx_session_tokens_revoked ON session_tokens(revoked);

-- ============================================
-- PERMISSIONS & ROLES
-- ============================================

CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  permission TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  granted_by TEXT
);

CREATE INDEX idx_user_permissions_user_email ON user_permissions(user_email);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  api_key_hash TEXT NOT NULL UNIQUE,
  key_name TEXT,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_user_email ON api_keys(user_email);

-- ============================================
-- ALERTS & INTEGRATION
-- ============================================

CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  affected_agents JSONB,
  status TEXT DEFAULT 'active',
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_status ON security_alerts(status);
CREATE INDEX idx_security_alerts_created_at ON security_alerts(created_at);

CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT DEFAULT 'success',
  payload JSONB,
  response JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_integration_logs_integration_name ON integration_logs(integration_name);
CREATE INDEX idx_integration_logs_status ON integration_logs(status);
CREATE INDEX idx_integration_logs_created_at ON integration_logs(created_at);

-- ============================================
-- ✅ COMPLETE - 23 TABLES CREATED
-- ============================================
