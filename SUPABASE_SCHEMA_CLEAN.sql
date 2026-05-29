drop table if exists cve_predictions cascade;
drop table if exists keypair_pool cascade;
drop table if exists capability_proofs cascade;
drop table if exists replay_nonces cascade;
drop table if exists honeypot_logs cascade;
drop table if exists behavioral_baseline cascade;
drop table if exists agent_actions cascade;
drop table if exists merkle_checkpoints cascade;
drop table if exists audit_logs cascade;
drop table if exists agent_tokens cascade;
drop table if exists agents cascade;
drop table if exists audit_chain cascade;
drop table if exists token_registry cascade;
drop table if exists armoriq_logs cascade;

create table agents (
  agent_id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text check (sector in ('banking','healthcare','legal','government','enterprise')),
  kyber_public_key text,
  dilithium_public_key text,
  dilithium_private_key_enc text,
  trust_score integer default 100,
  blacklisted boolean default false,
  blacklist_reason text,
  created_at timestamptz default now()
);
create index idx_agents_sector on agents(sector);
create index idx_agents_created_at on agents(created_at);

create table agent_tokens (
  token_id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(agent_id) on delete cascade,
  allowed_actions text[],
  dilithium_sig text,
  issued_at timestamptz default now(),
  expires_at timestamptz,
  revoked boolean default false
);
create index idx_agent_tokens_agent_id on agent_tokens(agent_id);

create table audit_logs (
  log_id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(agent_id) on delete set null,
  action_type text,
  payload jsonb,
  prev_hash text,
  current_hash text,
  dilithium_sig text,
  tampered boolean default false,
  timestamp timestamptz default now()
);
create index idx_audit_logs_agent_id on audit_logs(agent_id);
create index idx_audit_logs_timestamp on audit_logs(timestamp);

create table merkle_checkpoints (
  checkpoint_id uuid primary key default gen_random_uuid(),
  root_hash text,
  entry_count integer,
  verified boolean default true,
  created_at timestamptz default now()
);

create table agent_actions (
  action_id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(agent_id) on delete cascade,
  action_type text,
  payload jsonb,
  risk_score integer default 0,
  honeypot_routed boolean default false,
  blocked boolean default false,
  block_reason text,
  timestamp timestamptz default now()
);
create index idx_agent_actions_agent_id on agent_actions(agent_id);
create index idx_agent_actions_timestamp on agent_actions(timestamp);

create table behavioral_baseline (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(agent_id) on delete cascade,
  action_type text,
  frequency integer default 1,
  last_updated timestamptz default now()
);
create index idx_behavioral_baseline_agent_id on behavioral_baseline(agent_id);

create table honeypot_logs (
  log_id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(agent_id) on delete cascade,
  real_action text,
  fake_response jsonb,
  risk_score integer,
  timestamp timestamptz default now()
);
create index idx_honeypot_logs_agent_id on honeypot_logs(agent_id);
create index idx_honeypot_logs_timestamp on honeypot_logs(timestamp);

create table replay_nonces (
  nonce text primary key,
  agent_id uuid references agents(agent_id) on delete cascade,
  used_at timestamptz default now(),
  expires_at timestamptz
);
create index idx_replay_nonces_agent_id on replay_nonces(agent_id);

create table capability_proofs (
  proof_id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(agent_id) on delete cascade,
  action text,
  required_approvers integer default 3,
  approver_sigs jsonb default '[]',
  threshold_met boolean default false,
  created_at timestamptz default now()
);
create index idx_capability_proofs_agent_id on capability_proofs(agent_id);

create table cve_predictions (
  prediction_id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(agent_id) on delete set null,
  threat_type text,
  confidence integer,
  source_honeypot_log_id uuid,
  prediction_text text,
  created_at timestamptz default now()
);
create index idx_cve_predictions_agent_id on cve_predictions(agent_id);

create table keypair_pool (
  id uuid primary key default gen_random_uuid(),
  kyber_pub text,
  dilithium_pub text,
  dilithium_priv_enc text,
  used boolean default false,
  created_at timestamptz default now()
);
create index idx_keypair_pool_used on keypair_pool(used);
