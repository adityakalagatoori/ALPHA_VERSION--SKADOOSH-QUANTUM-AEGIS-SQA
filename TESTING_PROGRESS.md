# 🐼 SQA FINAL BUILD — FEATURE VERIFICATION CHECKLIST

**Status**: IN PROGRESS
**Date Started**: 2026-05-25
**Tester**: Claude Code + User

---

## 🔷 MONKEY — Post-Quantum Agent Identity

### M1: CRYSTALS-Suite Keypair per Agent
- [x] **COMPLETED** — Register new agent, verify Kyber-1024 + Dilithium keypair generated
- **Command**: `curl -X POST http://127.0.0.1:8000/agents/register -H "Content-Type: application/json" -d '{"name":"TestAgent1","sector":"Banking","allowed_actions":["read","execute"]}'`
- **Expected**: 200 OK + keypair in response
- **Status**: ✅ TESTED & VERIFIED - Agent registered with Kyber1024 + ML-DSA-65 keys, JWT token generated

### M2: Quantum Entropy Key Generation
- [x] **COMPLETED** — Verify keys use quantum-safe entropy, not standard RNG
- **Command**: Check logs for entropy source / crypto/entropy.py
- **Status**: ✅ TESTED & VERIFIED - Uses secrets.token_bytes(64) = 512 bits CSPRNG, SHA3-256 hashed, never storing raw

### M3: Signature Verification Gate
- [ ] **PENDING** — Send request with wrong/missing signature, verify blocked at gateway
- **Command**: Send request with invalid signature
- **Status**: NOT YET TESTED

### M4: Key Blacklisting
- [ ] **PENDING** — Blacklist agent mid-demo, verify future requests blocked
- **Command**: Blacklist endpoint + verify block
- **Status**: NOT YET TESTED

### M5: Replay-Sealed Payloads
- [ ] **PENDING** — Send same signed packet twice, verify 2nd blocked
- **Command**: Duplicate request test
- **Status**: NOT YET TESTED

### M6: Secure Enclave Shield
- [ ] **PENDING** — Verify private keys never printed/accessible
- **Command**: Memory isolation test
- **Status**: NOT YET TESTED

### M7: Oogway's Signal
- [ ] **PENDING** — Trigger identity threat, verify real-time alert fires
- **Command**: Blacklist agent, send request, check dashboard alert
- **Status**: NOT YET TESTED

---

## 🔷 CRANE — Scoped Capability Tokens

### C1: Signed JWT Token per Agent (5-min expiry)
- [ ] **PENDING** — Show token payload, try out-of-scope action, verify blocked
- **Command**: Generate JWT, inspect, test scope
- **Status**: NOT YET TESTED

### C2: Out-of-Scope Action Blocker
- [ ] **PENDING** — Give agent ["read"] scope, attempt "delete", verify blocked
- **Command**: Scope test
- **Status**: NOT YET TESTED

### C3: Dilithium MultiSig Capability Proofs
- [ ] **PENDING** — Trigger financial action, show it waiting for 2nd approver
- **Command**: Finance action test
- **Status**: NOT YET TESTED

### C4: ArmorIQ as Second Policy Gate
- [ ] **PENDING** — Show ArmorIQ dashboard logging policy enforcement
- **Command**: Check ArmorIQ platform logs
- **Status**: NOT YET TESTED

### C5: Mid-Execution Checkpoint
- [ ] **PENDING** — Start multi-step task, expire token mid-way, verify halts
- **Command**: Multi-step task + token expiry
- **Status**: NOT YET TESTED

### C6: Token Expired Mid-Task Halt
- [ ] **PENDING** — Wait for token expiry mid-task, verify next step blocked
- **Command**: Token expiry test
- **Status**: NOT YET TESTED

### C7: Jade Palace Tribunal
- [ ] **PENDING** — Show blocked action, show SHAP breakdown of why
- **Command**: Blocked action + SHAP explanation
- **Status**: NOT YET TESTED

---

## 🔷 SNAKE — Tamper-Proof Quantum Audit Chain

### S1: SHA-3-256 Immutable Audit Ledger
- [ ] **PENDING** — Show audit logs, edit one in DB, verify tamper alert fires
- **Command**: Audit log test + manual DB tamper
- **Status**: NOT YET TESTED

### S2: Dilithium-3 Quantum Audit Signing
- [ ] **PENDING** — Show log entry + Dilithium signature, verify live
- **Command**: Audit signature verification
- **Status**: NOT YET TESTED

### S3: Hash Chain
- [ ] **PENDING** — Show 5 log entries, prove each includes prev_hash
- **Command**: Hash chain continuity test
- **Status**: NOT YET TESTED

### S4: Live Tamper Detection (60-sec cycle)
- [ ] **PENDING** — Edit log entry, wait 60sec, verify red alert on dashboard
- **Command**: Tamper detection test
- **Status**: NOT YET TESTED

### S5: ArmorIQ Writes Directly
- [ ] **PENDING** — Show ArmorIQ platform log + SQA dashboard, verify same entries
- **Command**: Cross-platform log validation
- **Status**: NOT YET TESTED

### S6: Merkle Tree Checkpointed (60-sec)
- [ ] **PENDING** — Show Merkle root, tamper entry, verify root changes
- **Command**: Merkle tree integrity test
- **Status**: NOT YET TESTED

### S7: Sacred Peach Tree Visual
- [ ] **PENDING** — Live on dashboard, modify log, show branch turn red in real time
- **Command**: Visual tamper detection test
- **Status**: NOT YET TESTED

---

## 🔷 MANTIS — Gemini AI Anomaly Detection

### A1: 50-Action Behavioral Baseline per Agent
- [ ] **PENDING** — Show new agent baseline building in real time
- **Command**: Register agent, observe baseline building
- **Status**: NOT YET TESTED

### A2: Peer-Class Lattice Baseline
- [ ] **PENDING** — Register new agent, show it inherits peer baseline immediately
- **Command**: New agent registration
- **Status**: NOT YET TESTED

### A3: Real-Time Action Scoring (0–100)
- [ ] **PENDING** — Flood agent with 100 actions, show score spike, alert at 70
- **Command**: Rapid action flood test
- **Status**: NOT YET TESTED

### A4: Guardrailed Gemini
- [ ] **PENDING** — Show exactly what sent to Gemini (vectors only, not raw data)
- **Command**: Gemini payload inspection
- **Status**: NOT YET TESTED

### A5: Gemini under Signed BAA (HIPAA + SOC 2)
- [ ] **PENDING** — Show BAA reference in config, explain compliance
- **Command**: Check BAA config
- **Status**: NOT YET TESTED

### A6: On-Prem LLM Fallback (Llama/Mistral)
- [ ] **PENDING** — Switch OFFLINE_MODE=true, show scoring works via local LLM
- **Command**: Offline mode test
- **Status**: NOT YET TESTED

### A7: Auto-Route to Honeypot (score > 90)
- [ ] **PENDING** — Spike agent score past 90, verify auto-routed to honeypot
- **Command**: Honeypot auto-routing test
- **Status**: NOT YET TESTED

### A8: Honeypot Isolation Chamber
- [ ] **PENDING** — Show honeypot agent receiving fake "success", real DB unchanged
- **Command**: Honeypot isolation test
- **Status**: NOT YET TESTED

### A9: Oracle Scroll (Predictive CVE Model)
- [ ] **PENDING** — Show Oracle Scroll panel, show predicted threat from honeypot
- **Command**: Oracle predictions test
- **Status**: NOT YET TESTED

---

## 🔷 TIGRESS — Prompt Injection Defense via ArmorClaw

### T1: ArmorClaw Full-Message Scan
- [ ] **PENDING** — Send clean message (pass), send injection (blocked), show ArmorClaw dashboard
- **Command**: ArmorClaw scan test
- **Status**: NOT YET TESTED

### T2: JSON Injection Detection
- [ ] **PENDING** — Send role-override JSON, verify blocked by ArmorClaw
- **Command**: JSON injection test
- **Status**: NOT YET TESTED

### T3: URL & Base64 Injection Detection
- [ ] **PENDING** — Send base64-encoded malicious command, show decode + block
- **Command**: Base64 injection test
- **Status**: NOT YET TESTED

### T4: Session-Graph Semantic Hashing
- [ ] **PENDING** — Send 10 harmless messages slowly shifting context, show drift flagged on turn 10
- **Command**: Semantic drift test
- **Status**: NOT YET TESTED

### T5: Multi-Turn Injection as Drift Signature
- [ ] **PENDING** — Multi-turn attack that would pass per-message filters, caught by drift
- **Command**: Multi-turn injection test
- **Status**: NOT YET TESTED

### T6: Iron Cage Scroll
- [ ] **PENDING** — Show flagged agent, not killed, moved to honeypot, visible in honeypot panel
- **Command**: Iron Cage routing test
- **Status**: NOT YET TESTED

---

## 🔷 PO — Dragon Warrior (Central Gateway)

### P1: Central Message Gateway
- [ ] **PENDING** — Show any agent request routes through /po-gateway endpoint first
- **Command**: Traffic routing test
- **Status**: NOT YET TESTED

### P2: Sequences All 5 Warrior Checks
- [ ] **PENDING** — Show step-by-step check log: Tigress → Monkey → Crane → Snake → Mantis
- **Command**: Pipeline sequence test
- **Status**: NOT YET TESTED

### P3: Final Verdict (Deliver or Kill)
- [ ] **PENDING** — Show both: passing request (delivered) + failing request (killed)
- **Command**: Verdict comparison test
- **Status**: NOT YET TESTED

### P4: Kyber-1024 Encrypted Channels
- [ ] **PENDING** — Show encrypted payload in transit (ciphertext vs plaintext)
- **Command**: Encryption visibility test
- **Status**: NOT YET TESTED

### P5: 3-of-5 Dilithium Threshold Signing (BFT-Tolerant)
- [ ] **PENDING** — Demo high-value action, show 3-of-5 signing flow in dashboard
- **Command**: BFT signing test
- **Status**: NOT YET TESTED

### P6: Trust Score Network (0–100, live per agent)
- [ ] **PENDING** — Show trust score update in real time after each demo action
- **Command**: Live trust score test
- **Status**: NOT YET TESTED

### P7: Dilithium Financial Signing (Multi-Approver)
- [ ] **PENDING** — Trigger finance agent action, show multi-approver flow
- **Command**: Financial signing test
- **Status**: NOT YET TESTED

### P8: Live Security Command Dashboard
- [ ] **PENDING** — Open dashboard live, show all panels updating in real time
- **Command**: Dashboard live update test
- **Status**: NOT YET TESTED

### P9: Global Security Command Dashboard (Sector Filter)
- [ ] **PENDING** — Switch sector filter, show only banking/healthcare agents
- **Command**: Sector filtering test
- **Status**: NOT YET TESTED

### P10: Tamper-Proof Logs Display
- [ ] **PENDING** — Show audit entry with hash + signature, click verify, show clean/tampered
- **Command**: Log verification test
- **Status**: NOT YET TESTED

### P11: Live Risk Scoring Display
- [ ] **PENDING** — Show line chart, run anomalous action, watch score spike
- **Command**: Risk chart live update test
- **Status**: NOT YET TESTED

---

## ⚔️ 11 ATTACK VECTORS — Mirror Test

### Attack 1: Stolen API Key
- [ ] Register agent → blacklist → send request → BLOCKED
- **Status**: NOT YET TESTED

### Attack 2: Replay Attack
- [ ] Send same signed packet twice → 2nd BLOCKED
- **Status**: NOT YET TESTED

### Attack 3: Expired Token
- [ ] Expire token → use it → BLOCKED
- **Status**: NOT YET TESTED

### Attack 4: Out-of-Scope Action
- [ ] ["read"] scope → try "delete" → BLOCKED
- **Status**: NOT YET TESTED

### Attack 5: Audit Log Tamper
- [ ] Edit hash in DB → verify-chain → DETECTED
- **Status**: NOT YET TESTED

### Attack 6: JSON Injection
- [ ] Send role-override JSON → BLOCKED by ArmorClaw
- **Status**: NOT YET TESTED

### Attack 7: Base64 Injection
- [ ] Send base64 payload → decoded + BLOCKED
- **Status**: NOT YET TESTED

### Attack 8: Multi-Turn Injection
- [ ] 10-message drift attack → BLOCKED by session graph
- **Status**: NOT YET TESTED

### Attack 9: Behavioral Anomaly
- [ ] 100 actions in 10 sec → FLAGGED (score > 70)
- **Status**: NOT YET TESTED

### Attack 10: Cold-Start Baseline Poisoning
- [ ] Fake history at registration → peer-class baseline overrides → BLOCKED
- **Status**: NOT YET TESTED

### Attack 11: Quantum Key Forgery
- [ ] Random Dilithium signature → BLOCKED instantly
- **Status**: NOT YET TESTED

---

## 🌍 SECTORS VALIDATION

### Banking Sector
- [ ] Kyber-1024 channel encryption + Dilithium payment signing
- **Test**: Finance agent multi-approver flow
- **Status**: NOT YET TESTED

### Healthcare Sector
- [ ] Tamper-proof audit trails + HIPAA-compliant Gemini BAA
- **Test**: Audit chain + BAA config + capability-locked agent
- **Status**: NOT YET TESTED

### Legal Sector
- [ ] Behavior monitoring + zero-trust execution + tamper-proof trail
- **Test**: Behavioral score + blocked out-of-scope + verify log
- **Status**: NOT YET TESTED

### Government Sector
- [ ] Post-quantum identity + real-time anomaly intelligence
- **Test**: Monkey keypair + Mantis live scoring
- **Status**: NOT YET TESTED

---

## SUMMARY

**Total Features**: 47
**Completed**: 2 / 47
**In Progress**: 0
**Blocked**: 0
**Failed**: 0

**Next Step**: MONKEY M3 — Signature Verification Gate

