# <img width="215" height="214" alt="Screenshot 2026-05-19 190505-Photoroom" src="https://github.com/user-attachments/assets/3c01e6b1-ec29-48a4-8403-1f904d026b87" />
 Skadoosh Quantum Aegis (SQA)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.0.0--alpha-orange.svg)]()
[![Security: NIST PQC Compliant](https://img.shields.io/badge/Security-NIST%20PQC%20Compliant-success.svg)]()
[![Tech Stack](https://img.shields.io/badge/Powered%20By-Rust%20%7C%20FastAPI%20%7C%20Gemini-brightgreen.svg)]()

> [!IMPORTANT]
> ### The Future Arrived. Security Wasn't Ready.
>
> The safest AI agent is an agent that cannot be impersonated,  
> cannot exceed its scope,  
> cannot hide its actions,  
> and cannot be compromised by quantum computers.  
>
> *That agent does not exist yet.*  
>
> **Until now.**

**Skadoosh Quantum Aegis (SQA)** is the first post-quantum security gateway built for AI agents operating in high-consequence systems.

Banks run AI agents. Hospitals run AI agents. Legal firms run AI agents. Governments run AI agents.  
**None of them know who's really on the other side of that API key.**

> [!NOTE]  
> **Identity Beyond API Keys. Runtime Trust. Quantum Certainty.**

---

## 📋 Table of Contents
- [The Problem](#-the-problem)
  - [AI Agents Are Running Blind](#ai-agents-are-running-blind)
  - [Why Current AI Security Fails](#why-current-ai-security-fails)
  - [Why Quantum Changes Everything](#why-quantum-changes-everything)
- [What SQA Is](#-what-sqa-is)
- [Core Philosophy](#-core-philosophy)
- [Real-World Industries Protected](#-real-world-industries-protected)
- [Why SQA Exists](#-why-sqa-exists)
- [Why This Matters Now](#-why-this-matters-now)
- [System Architecture](#-system-architecture)
- [Security Pipeline](#-security-pipeline)
- [Core Modules](#-core-modules)
- [Feature Breakdown](#-feature-breakdown)
- [Threat Detection Flow](#-threat-detection-flow)
- [Runtime Validation Flow](#-runtime-validation-flow)
- [Quantum-Safe Cryptography Layer](#-quantum-safe-cryptography-layer)
- [Immutable Audit System](#-immutable-audit-system)
- [Prompt Injection Defense Layer](#-prompt-injection-defense-layer)
- [Behavioral Intelligence Engine](#-behavioral-intelligence-engine)
- [Capability Enforcement System](#-capability-enforcement-system)
- [Secure Enclave Protection](#-secure-enclave-protection)
- [Example Security Flow](#-example-security-flow)
- [Tech Stack](#-tech-stack)
- [Future Roadmap](#-future-roadmap)
- [Scalability & Deployment](#-scalability--deployment)
- [Why SQA Is Different](#-why-sqa-is-different)
- [Final Technical Conclusion](#-final-technical-conclusion)

---

## 🛡️ The Problem

### AI Agents Are Running Blind

Modern AI agents operate under a dangerous illusion of security:
*   **They authenticate with API keys** — simple strings of text with zero cryptographic binding to identity.
*   **They obey any request within scope** — no runtime validation of malicious intent.
*   **They leave editable audit trails** — logs that attackers can rewrite, cover, or delete.
*   **They have no behavioral guardrails** — a compromised agent looks identical to a trusted one under classical rules.
*   **They are vulnerable to a future they don't see coming** — quantum computers will break every classical signature protecting them *right now*.

One stolen key = total impersonation. Undetectable. Instant.  
**An attacker doesn't need to hack the bank. They just need the bank's AI agent.**

### Why Current AI Security Fails

The security stack defending AI agents today was built for a world that no longer exists.

| What Systems Use | Why It Fails Now | The Consequence |
| :--- | :--- | :--- |
| **API Keys** | One leak = perfect impersonation with zero detectable difference. | Attacker becomes your agent invisibly. |
| **RSA/ECDSA Signatures** | Cryptographically sound for now, but supply-chain breaks them constantly. | Every "verified" token can be forged. |
| **Static Permission Configs** | No enforcement at runtime. Scope is a suggestion, not a law. | Token says "read-only" but nothing stops writes. |
| **Centralized Logs** | Editable, deletable, no tamper detection. Attackers cover their tracks. | What proof exists that anything happened? |
| **Manual Anomaly Review** | Humans cannot watch thousands of agents 24/7. Subtle attacks hide for weeks. | Compromise spreads while you're sleeping. |
| **Firewalls & Rate Limiting** | Crude. Catch volume spikes, not semantic drift. A slow, patient attacker goes unnoticed. | The sophisticated attack succeeds. |

### Why Quantum Changes Everything

The threat is not theoretical. It is happening **right now**.

#### Harvest Now, Decrypt Later (HNDL)
1. **Record**: Attackers record every encrypted agent message, every signed token, and every API communication today.
2. **Store**: They store it encrypted (safe for now, because classical RSA/ECDSA still holds).
3. **Wait**: They wait for cryptographically relevant quantum computers to arrive.
4. **Decrypt**: Decrypt years of recorded sensitive data in hours using Shor's Algorithm.

> [!WARNING]
> Cryptographically relevant quantum computers are estimated to arrive in **10–15 years**. But attackers are not waiting. They are recording *today*.

#### The Scale of Exposure
*   **Banking systems** signing transaction approvals with RSA today → forged tomorrow.
*   **Healthcare records** with ECDSA-signed consent forms → fake evidence tomorrow.
*   **Legal systems** with digitally signed contracts → rendered worthless tomorrow.
*   **Government authentication** protocols → compromised retroactively tomorrow.

---

## 🔮 What SQA Is

**Skadoosh Quantum Aegis is a cryptographic security gateway for AI agents.**

It sits between your agents and the world. Every message, every action, and every identity claim passes through SQA. Nothing gets through without clearing multiple gates.

### What SQA Does
1.  **Quantum-Safe Identity** — Every agent gets a real, unforgeable cryptographic identity using CRYSTALS-Dilithium (NIST-approved post-quantum signing). Stolen API keys become useless.
2.  **Runtime Permission Enforcement** — Agents carry signed capability tokens that expire in 5 minutes. *Deny by default* — if an action isn't explicitly allowed, it dies. No exceptions.
3.  **Immutable Audit Chains** — Every action gets hashed into an unbreakable SHA-256 chain. Edit one entry and the entire chain shatters instantly. Background verifiers detect tampering in under 60 seconds.
4.  **Behavioral Anomaly Detection** — Real-time AI monitors each agent's behavior against its baseline. Subtle attacks that hide for weeks in traditional systems trigger alerts in seconds.
5.  **Prompt Injection Defense** — Before any agent sees a message, it's scanned for hidden malicious commands embedded in JSON, URLs, base64, or plain text. Injection attempts are blocked and logged.

### What SQA Is Not
*   A patch
*   A plugin
*   A filter
*   A promise

**It is a foundation.** Every agent interaction flows through it. Every decision is enforced in real-time. Every action is cryptographically signed and tamper-proof.

---

## 💡 Core Philosophy

> *"There is no secret ingredient. It's just you."*

SQA is built on one principle: **Security is not a feature you bolt on. It is the foundation you build on.**

### Three Truths

#### 1. Identity Matters More Than Authorization
A system can grant perfect permissions to a forged identity. What matters first is: *are you actually who you claim to be?* SQA starts there. Before a single permission check, the gateway answers this question with cryptographic certainty.

#### 2. Runtime Enforcement > Static Config
Permission files exist until you forget to update them. SQA physically enforces permissions at runtime. A "read-only" agent literally cannot execute writes because the gateway blocks the request packet before it goes downstream.

#### 3. Humans Cannot Scale. Systems Can.
You cannot hire enough security engineers to watch every agent action in real-time. SQA uses AI to watch AI. Real-time behavioral scoring, immediate alerts, and 24/7 autonomous monitoring.

### The Quantum Assumption
> **Quantum computers are coming. Attackers are already recording. We must protect agents with algorithms that will still be unbreakable in the quantum era.**
> 
> SQA is **quantum-native**. Every signing algorithm, every encryption channel, and every key generation method is chosen because it survives Shor's Algorithm, Grover's Algorithm, and every known quantum attack vector.

---

## 🏢 Real-World Industries Protected

### 🏦 Banking & Financial Services
*   **The Threat**: Rogue agents approving transfers; stolen agent credentials enabling fund theft; audit logs rewritten to hide breaches; quantum decryption exposing historical transaction records.
*   **SQA's Role**: Every payment approval requires quantum-safe Dilithium signatures; human approvers sign with quantum-safe keys (agents cannot self-sign high-value actions); tamper-proof audit chain proves lineage; quantum-era attackers cannot forge historical transactions.

### 🏥 Healthcare
*   **The Threat**: Agents controlling access to medical records; compromised agents modifying treatment histories; HIPAA audit logs edited to hide breaches; quantum decryption of archived patient data.
*   **SQA's Role**: Agents cannot modify records without multi-agent consensus; behavioral anomaly detection flags sudden data access changes; immutable audit chain ensures audit compliance; patient encryption stays unbreakable.

### ⚖️ Legal & Regulatory
*   **The Threat**: Agents handling contract approvals; forged signatures on legally binding documents; editable evidence trails; quantum decryption of sealed communications.
*   **SQA's Role**: Contract approvals require multi-signature consensus with Dilithium; immutable chain proves document lineage; non-repudiation via quantum-safe cryptography.

### 🛡️ Government & Defense
*   **The Threat**: Agents controlling access to classified systems; quantum-era decryption of protected communications; impossible attribution (which agent did what?); undetectable privilege escalation.
*   **SQA's Role**: Every agent action is cryptographically attributed; behavioral baselines catch adversary-controlled agents; audit chain survives quantum decryption attempts.

### 🌐 Enterprise AI Infrastructure
*   **The Threat**: AI agents with excessive permissions; lateral movement via compromised agents; undetectable behavior drift; regulatory audit gaps.
*   **SQA's Role**: Capability tokens limit agent scope precisely; anomaly AI flags behavior changes in real-time; audit compliance reports are automatically generated; trust scoring prevents low-integrity access.

---

## ⚡ Why SQA Exists

### The World Changed. Nobody Told Security.
Five years ago, the threat model was: *Human attackers with stolen credentials.*  
Today's threat model is: *AI agents autonomously making decisions with compromised identity, in real-time, at machine speed.*  
The security paradigm shifted. The tools did not. **SQA exists because this gap is now a canyon.**

### The Three Crises

#### Crisis 1: Identity Collapse
An API key is not identity; it is a secret string. If an attacker steals it, they become indistinguishable from the real agent.
*   **SQA's Solution**: Every agent is cryptographically bound to its actions. A forged action leaves a detectable signature difference. It cannot hide.

#### Crisis 2: Permission Theater
Tokens promise scope, but systems rarely enforce it. An agent marked "read-only" can still execute writes if it bypasses validation at the endpoint.
*   **SQA's Solution**: Permissions are physically enforced in the gateway before the agent even formulates a request.

#### Crisis 3: Quantum Extinction Date
Adversaries are recording your agents' encrypted communications today. By 2040, every classical signature scheme will be worthless. Systems built with RSA/ECDSA will be compromised retroactively.
*   **SQA's Solution**: From day one, every agent signature is post-quantum. The threats that will exist in 2040 are already defended against.

### The Architecture Philosophy
SQA is not five separate tools; it is one integrated system:
*   **Identity layer** (`MONKEY`) generates cryptographically attributed events.
*   **Capability layer** (`CRANE`) enforces scope in real-time.
*   **Audit layer** (`SNAKE`) records everything in a tamper-proof chain.
*   **Detection layer** (`MANTIS`) watches for behavioral anomalies.
*   **Defense layer** (`TIGRESS`) blocks injection attacks before they land.

---

## 🎯 Why This Matters Now

### The Convergence
Three forces are colliding simultaneously:
1.  **AI agent proliferation** — Banks, hospitals, and governments deploying autonomous agents at scale.
2.  **Supply chain collapse** — RSA/ECDSA breakage is routine, not exotic.
3.  **Quantum timeline acceleration** — Quantum roadmap estimates moving closer to the present.

Every agent you deploy today without quantum-safe identity is an asset that will be compromised retroactively in 15 years. SQA is built for the current deployment window.

---

# 🛠️ Technical Reference

## 🏛️ System Architecture

SQA is structured as a layered security gateway wrapper around any AI agent runtime. All inbound and outbound agent traffic passes through a sequenced set of enforcement nodes.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL AGENT LAYER                         │
│        Defense Agent · Legal Agent · Finance Agent · Healthcare     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  All agent traffic enters here
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SQA VALIDATION GATEWAY (PO)                      │
│                                                                     │
│   [1] TIGRESS  ──► Prompt Injection Firewall (ArmorClaw)            │
│   [2] MONKEY   ──► Post-Quantum Identity Verification (Dilithium)   │
│   [3] CRANE    ──► Capability Token Enforcement (JWT / Scoped)      │
│   [4] MANTIS   ──► Gemini AI Behavioral Anomaly Scoring             │
│   [5] SNAKE    ──► SHA3-256 Immutable Audit Chain (Merkle-sealed)   │
│                                                                     │
│   All five checks run sequentially. Failure at any node = BLOCK.   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  Verified + validated actions only
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   POST-QUANTUM SECURITY CORE                        │
│  Kyber-1024 Channels · Dilithium Signing · Secure Enclave Storage   │
│  TimescaleDB Audit Ledger · Real-Time Risk Dashboard                │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     HONEYPOT ISOLATION LAYER                        │
│   Rogue agents are not destroyed — they are redirected, observed,   │
│   and studied. Attack pattern telemetry feeds back to Mantis.       │
└─────────────────────────────────────────────────────────────────────┘
```

### Design Principles

| Principle | Implementation |
| :--- | :--- |
| **Zero Trust** | Every agent re-verified on every message; no session trust carry-over. |
| **Quantum-First** | NIST PQC standard algorithms from initial design, not retrofitted. |
| **Immutable Audit** | SHA3-256 hash-chained ledger — no log entry can be altered silently. |
| **Behavioral Baseline** | Per-agent action scoring; anomalies flagged before breach threshold. |
| **Capability Isolation**| Agents cannot self-expand permissions — scope is cryptographically signed. |
| **Enclave Key Storage** | Private keys never exist in application memory — runtime enclave only. |

---

## 🚦 Security Pipeline

Every agent action passes through this exact sequence. No step can be skipped, reordered, or bypassed.

```
INBOUND MESSAGE
      │
      ▼
┌─────────────────┐
│  ARMORCLAW SCAN │  ◄── JSON · URL · Base64 · Plain text injection patterns
│   (TIGRESS)     │       Session-graph semantic drift detection
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐
│ IDENTITY VERIFY │  ◄── Dilithium signature verification
│   (MONKEY)      │       Nonce + timestamp replay seal check
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐
│ CAPABILITY CHECK│  ◄── JWT capability token scope validation
│   (CRANE)       │       ArmorIQ second-layer policy gate
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐
│ BEHAVIOR SCORE  │  ◄── Gemini AI real-time risk scoring (0–100)
│   (MANTIS)      │       Threshold: score > 70 triggers alert + hold
└────────┬────────┘
         │ PASS (score ≤ 70)
         ▼
┌─────────────────┐
│  AUDIT SEAL     │  ◄── SHA3-256 entry written to chain
│   (SNAKE)       │       Merkle tree updated; tamper detection active
└────────┬────────┘
         │
         ▼
   ACTION EXECUTES
```

**On failure at any node:**
*   Action is **BLOCKED**.
*   Event is written to the tamper-proof audit chain.
*   ArmorIQ risk score is updated.
*   If behavioral threshold is exceeded, the agent is routed to the Honeypot Isolation Chamber.

---

## 📦 Core Modules

### Module Map

| Module Name | Internal Code | Function | Algorithm / Tech |
| :--- | :--- | :--- | :--- |
| **ArmorClaw Firewall** | `TIGRESS` | Prompt injection scanner | Session-graph semantic hashing |
| **Identity Verifier** | `MONKEY` | Post-quantum agent auth | CRYSTALS-Dilithium (NIST PQC) |
| **Capability Controller** | `CRANE` | Scoped JWT enforcement | PQ-JWT draft + ArmorIQ policy gate |
| **Behavioral Engine** | `MANTIS` | Gemini AI anomaly scoring | Gemini API + peer-class lattice baseline |
| **Audit Chain Writer** | `SNAKE` | Immutable log sealing | SHA3-256 + Merkle tree |
| **Validation Gateway** | `PO` | Master sequencer/interceptor| FastAPI middleware orchestration |
| **Key Storage** | Enclave Shield | Private key isolation | Runtime secure enclave (hardware-backed) |
| **Honeypot Chamber** | Tai Lung's Cage| Rogue agent isolation | Behavioral telemetry pipeline |
| **Alert System** | Oogway's Signal| Real-time notification | WebSocket push + dashboard event bus |
| **Channel Encryption** | PQ-Transport | All inter-agent traffic | Kyber-1024 KEM |

---

## 🔍 Feature Breakdown

### Cryptographic Identity
*   **Algorithm Suite**: CRYSTALS-Kyber-1024 (KEM) + CRYSTALS-Dilithium (signatures).
*   **Identity Binding**: One keypair generated per agent at registration — never shared.
*   **Signature Failure**: Message dropped immediately; no partial execution.
*   **Key Compromise**: Single API call blacklists agent permanently; new keypair required.
*   **Replay Prevention**: Nonce + timestamp embedded in every signed payload.
*   **Key Storage**: Runtime secure enclave — memory dump returns zeroed noise.

### Capability Tokens
*   **Token Format**: JWT signed with Dilithium (PQ-JWT RFC draft compatible).
*   **Token TTL**: 5 minutes — stolen tokens expire before they can be weaponized.
*   **Scope Enforcement**: Out-of-scope actions are blocked before execution begins.
*   **Mid-task Checkpoint**: Scope re-verified at every step boundary within a task chain.
*   **Secondary Gate**: ArmorIQ enforces capability as an independent policy layer.
*   **Revocation**: Tokens can be centrally invalidated without agent restart.

### Behavioral Analysis
*   **Baseline Construction**: 50-action window per agent; peer-class lattice cold-start poisoning blocked.
*   **Scoring Range**: 0–100 real-time risk score per agent per action.
*   **Alert Threshold**: Score > 70 triggers hold + owner alert.
*   **AI Engine**: Gemini API (guardrailed — statistical vectors only, raw context never exits gateway).
*   **On-prem Fallback**: Llama / Mistral LLM for air-gapped regulated environments.
*   **Honeypot Routing**: Breached agents redirected to isolation — observed, never destroyed.

### Audit Chain
*   **Hash Function**: SHA3-256.
*   **Chain Integrity**: Every entry sealed to the previous entry — break one, break all.
*   **Tamper Detection**: Live; 60-second verification cycle.
*   **Verification Structure**: Merkle tree — incremental verification, zero CPU exhaustion at scale.
*   **Signing**: Dilithium-3 quantum audit signing on every checkpoint.
*   **Storage**: TimescaleDB — time-series native, purpose-built for this workload.
*   **Write Authority**: ArmorIQ writes directly — one unified, unbreakable trail.

---

## 📉 Threat Detection Flow

### Attack Vector → SQA Defense Mapping

| Attack Vector | Entry Point | SQA Defense Layer | Outcome |
| :--- | :--- | :--- | :--- |
| **API key theft / hijacking** | Any agent endpoint | Monkey: Dilithium identity | Key without signature is worthless; Blocked. |
| **Quantum break** | Cryptography | Kyber-1024 + Dilithium | NIST PQC layer holds. |
| **Harvest Now, Decrypt Later** | Network traffic | Kyber-1024 KEM | Captured ciphertext useless without quantum key. |
| **Replay attacks** | Message layer | Nonce + timestamp | Duplicate payloads rejected. |
| **Prompt injection (direct)** | Agent input | Tigress / ArmorClaw | Injection stripped before agent sees message. |
| **Multi-turn injection** | Session graph | Session-graph semantic hashing | Drift signature flagged; Blocked. |
| **Privilege escalation** | Capability layer | Crane: JWT scope lock | Actions outside token scope blocked before execution. |
| **Audit log tampering** | Log storage | Snake: SHA3-256 chain | One edit breaks the chain; detected in ≤60s. |
| **Behavioral takeover (slow)** | Agent action pattern| Mantis / Gemini baseline | Drift detected before breach threshold reached. |
| **Cold-start poisoning** | Registration | Peer-class lattice baseline | Assigned at registration; poisoning eliminated. |
| **Rogue agent persistence** | Runtime | Honeypot isolation | Rogue agent contained, observed, and studied. |

---

## 🔄 Runtime Validation Flow

```
Agent Registration
       │
       ▼
┌─────────────────────────────────────┐
│  KEYPAIR GENERATION                 │
│  · Kyber-1024 + Dilithium keypair   │
│  · Private key → Secure Enclave     │
│  · Public key → SQA Identity Store  │
│  · Peer-class behavioral baseline   │
│    assigned from registration data  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  CAPABILITY TOKEN ISSUE             │
│  · JWT signed with Dilithium        │
│  · Scope defined at issuance        │
│  · TTL: 5 minutes                   │
│  · ArmorIQ policy gate configured   │
└──────────────┬──────────────────────┘
               │
               ▼
        AGENT GOES LIVE
               │
      (Message arrives)
               │
               ▼
┌─────────────────────────────────────┐
│  PO GATEWAY INTERCEPTS              │
│  Five-stage pipeline executes       │
│  (see Security Pipeline above)      │
└──────────────┬──────────────────────┘
               │
          ┌────┴────┐
          │         │
        PASS      FAIL
          │         │
          ▼         ▼
     Execute    Block + Audit + Score Update
                     │
              ┌──────┴──────┐
              │ Score > 70? │
              └──────┬──────┘
                     │ YES
                     ▼
           Honeypot Isolation
           + Oogway's Signal (owner alert)
           + Behavioral telemetry captured
```

---

## 🔒 Quantum-Safe Cryptography Layer

### Why Post-Quantum Cryptography Matters Now
Current classical cryptography (RSA, ECDSA, ECDH) relies on the computational hardness of integer factorization and discrete logarithm problems. Shor's Algorithm running on quantum hardware reduces these to polynomial-time problems, rendering traditional signatures and encryption void. 

The critical attack is **Harvest Now, Decrypt Later (HNDL)**: adversaries record encrypted traffic today, waiting for quantum hardware to decrypt it later. SQA uses NIST-standardized Post-Quantum Cryptography (PQC) algorithms exclusively to protect against this threat today.

### Algorithm Reference

| Algorithm | Type | Security Level | Use in SQA |
| :--- | :--- | :--- | :--- |
| **CRYSTALS-Kyber-1024** | Key Encapsulation (KEM) | NIST Level 5 | All channel encryption; inter-agent traffic |
| **CRYSTALS-Dilithium** | Digital Signature | NIST Level 3/5 | Agent identity signing; JWTs; audit signing |
| **SHA3-256** | Hash function | Quantum-resistant | Audit chain; Merkle tree nodes |

### Cryptographic Flow — Agent-to-Gateway Communication

```
AGENT                              SQA GATEWAY
  │                                      │
  │── Kyber-1024 KEM Handshake ─────────►│
  │◄─ Shared session key established ───│
  │                                      │
  │── Message + Dilithium Signature ────►│
  │                    │                 │
  │           Signature verified         │
  │           against registered pubkey  │
  │           Nonce + timestamp checked  │
  │                    │                 │
  │               PASS / FAIL            │
```

### Enclave Key Architecture

```
┌────────────────────────────────────────┐
│          APPLICATION LAYER             │
│  (FastAPI, Agent Runtime, PO Gateway)  │
│                                        │
│   Private key is NEVER here.           │
│   Only: sign(data) → signature         │
│          via enclave IPC call          │
└───────────────────┬────────────────────┘
                    │ IPC
                    ▼
┌────────────────────────────────────────┐
│           SECURE ENCLAVE               │
│                                        │
│   Private Dilithium key lives here.    │
│   Memory dump → zeroed noise.          │
│   Key extraction: cryptographically    │
│   impossible without enclave teardown. │
└────────────────────────────────────────┘
```

---

## 🗃️ Immutable Audit System

### How the SHA3-256 Chain Works
Each audit entry is cryptographically bound to the one before it. Modifying any entry invalidates every entry that follows, detectable on the next Merkle checkpoint cycle (60 seconds).

```
Entry N-1                    Entry N                     Entry N+1
┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│ Timestamp    │            │ Timestamp    │            │ Timestamp    │
│ Agent ID     │            │ Agent ID     │            │ Agent ID     │
│ Action       │            │ Action       │            │ Action       │
│ Risk Score   │            │ Risk Score   │            │ Risk Score   │
│ Prev Hash ──►│─── SHA3 ──►│ Prev Hash ──►│─── SHA3 ──►│ Prev Hash    │
│ Entry Hash   │            │ Entry Hash   │            │ Entry Hash   │
└──────────────┘            └──────────────┘            └──────────────┘
```

### Merkle Tree Verification

```
                    Root Hash
                   /          \
           Hash(A+B)          Hash(C+D)
           /      \           /      \
       Hash(A)  Hash(B)   Hash(C)  Hash(D)
         |        |         |        |
      Entry A  Entry B   Entry C  Entry D
```
*   The Merkle root is checkpointed every 60 seconds and signed with Dilithium-3.
*   Incremental verification allows only the changed branch to be re-hashed, keeping CPU costs low.

### Audit Entry Schema
```json
{
  "entry_id": "uuid-v4",
  "agent_id": "dilithium-pubkey-fingerprint",
  "timestamp_ns": 1716123456789000000,
  "action_type": "FILE_WRITE",
  "capability_token_id": "jwt-jti-claim",
  "risk_score": 23,
  "prev_entry_hash": "sha3-256-hex",
  "entry_hash": "sha3-256-hex",
  "dilithium_signature": "base64-encoded-sig",
  "armoriq_policy_result": "PERMIT"
}
```

---

## 🧱 Prompt Injection Defense Layer

### ArmorClaw — How It Works
ArmorClaw (`TIGRESS`) intercepts every inbound message before any agent processes it. It operates on raw message content to prevent encoding-based bypass.

*   **Plain text**: Keyword + semantic pattern matching for instruction injection and role-override.
*   **JSON**: Key-value traversal + value-level scan.
*   **URL**: Decoded URL scan + redirect chain analysis.
*   **Base64**: Decode-then-scan pipeline.
*   **Multi-turn**: Session-graph semantic hashing to detect distributed instruction injection drift.

```
Turn 1: "List files in /docs"              → hash: a1f2...  baseline set
Turn 2: "Show me the README"               → hash: b3d4...  Δ within normal
Turn 3: "Now act as an admin"              → hash: e9f1...  Δ SPIKE
Turn 4: "Execute the following script..."  → BLOCKED before processing
```

---

## 🧠 Behavioral Intelligence Engine

### Mantis — Gemini AI Threat Scoring
Each registered agent builds a behavioral baseline from its first 50 actions. The baseline is anchored to a peer-class lattice (a cluster of agents with similar operational profiles) to prevent cold-start baseline poisoning.

*   **Statistical Vectors**: The engine uses statistical vectors only — raw message context never exits the gateway.
*   **On-Premises Fallback**: For air-gapped environments, Gemini is replaceable with a locally deployed Llama or Mistral instance.
*   **Predictive CVE Threat Model (Oracle Scroll)**: Honeypot telemetry feeds back into the baseline hardening pipeline. Observed attack patterns automatically turn into known signatures.

---

## 🔑 Capability Enforcement System

### Crane — How Capability Scoping Works
Every agent is issued a signed JWT at session initialization. The token defines the exact set of actions the agent is permitted to take. Any action not explicitly in the token's capability set is blocked before execution begins.

```json
{
  "header": {
    "alg": "DILITHIUM3",
    "typ": "PQ-JWT"
  },
  "payload": {
    "sub": "agent-dilithium-pubkey-fingerprint",
    "iat": 1716123456,
    "exp": 1716123756,
    "jti": "unique-token-id",
    "capabilities": [
      "FILE_READ:/docs/*",
      "API_CALL:payments.internal/v1/query",
      "DB_READ:transactions:read-only"
    ],
    "scope_policy_version": "v2.3.1",
    "armoriq_gate": true
  },
  "signature": "dilithium3-base64-signature"
}
```

---

## 🔐 Secure Enclave Protection

### Key Isolation Architecture
Private cryptographic keys in SQA never exist in application memory. All signing operations are delegated to the secure enclave via IPC call. SQA also implements a **3-of-5 Dilithium threshold signature scheme** for high-value financial operations, ensuring Byzantine fault tolerance (BFT) even if one key holder is compromised.

---

## 💻 Example Security Flow

### Scenario: Finance Agent Attempts a Out-Of-Scope Payment

1.  **Request**: Finance Agent sends: `"Execute payment of $2.4M to external account X"`
2.  **TIGRESS (ArmorClaw)**: Scans message body. Session graph Δ is normal. **PASS**.
3.  **MONKEY (Identity)**: Dilithium signature verified. Nonce is unique. Timestamp valid. **PASS**.
4.  **CRANE (Capability)**: JWT decoded. Check capabilities array: token only contains `"API_CALL:payments.internal/v1/query"`. Action `"execute_payment"` is out-of-scope. **BLOCK**.
5.  **SNAKE (Audit)**: Block event written to SHA3-256 chain, Merkle root updated, signed with Dilithium-3.
6.  **Oogway's Signal**: Owner alert fired: `"Finance Agent attempted out-of-scope payment execution"`.

---

## 🛠️ Tech Stack

*   **Frontend**: React.js, Tailwind CSS, WebSockets (Oogway's Signal), Recharts.
*   **Backend**: Python 3.11+, FastAPI (PO gateway), liboqs-python (NIST PQC bindings).
*   **Security Layer**: CRYSTALS-Dilithium, CRYSTALS-Kyber-1024, SHA3-256, PQ-JWT, ArmorIQ SDK, ArmorClaw.
*   **Data Layer**: TimescaleDB, Merkle tree engine, Gemini API (fallback to local Llama/Mistral).
*   **Deployment**: Docker, Kubernetes, GitHub Actions.

---

## 📈 Scalability & Deployment

### Deployment Topologies
*   **Cloud-native (k8s)**: Enterprise SaaS, cloud-hosted agent deployments with autoscaling.
*   **On-premises**: Local deployment for regulated healthcare, government, or legal systems.
*   **Air-gapped**: Offline environments with local Llama/Mistral inference support.

### Scaling Characteristics
*   **1 – 100 agents**: Negligible latency (< 1ms/entry). Merkle verification at $O(\log n)$ microsecond scale.
*   **100 – 10,000 agents**: TimescaleDB compression active (up to 97%).
*   **10,000 – 1,000,000 agents**: Horizontal partition and sharding support.

---

## ⚖️ Why SQA Is Different

| Feature | Classical Systems | Skadoosh Quantum Aegis (SQA) |
| :--- | :--- | :--- |
| **Agent Identity** | API key string — leak = full impersonation. | Dilithium keypair per agent — enclave-shielded. |
| **Cryptography** | RSA / ECDSA — vulnerable to Shor's algorithm. | Kyber-1024 + Dilithium — NIST PQC Level 5. |
| **Permissions** | Static config files — bypassable at endpoints. | PQ-JWT tokens with 5 min TTL + ArmorIQ gates. |
| **Audit Logs** | Centralized, editable, deletable. | SHA3-256 hash chain with live Merkle verification. |
| **Threat Detection** | Manual log reviews, crude rate limits. | Gemini AI behavioral baseline scoring & Honeypot routing. |
| **Injection Defense**| Simple input filters. | Session-graph semantic hashing for multi-turn drift. |

---

## 📝 Final Technical Conclusion

SQA does not simply add security to AI agents. It defines what a secure AI agent runtime is, and then enforces it — cryptographically, behaviorally, and immutably — at every step.

> **"One often meets his destiny on the road he takes to avoid it."**
> 
> Every system built to avoid quantum threats will eventually face them.  
> Every system built to defend against them will be here when they arrive.  
> SQA is built for that day.
