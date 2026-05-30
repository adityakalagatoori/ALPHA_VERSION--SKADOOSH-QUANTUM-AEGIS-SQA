import axios from "axios";
import { supabase } from "../lib/supabase";

const BASE = import.meta.env.VITE_API_BASE ?? "";

export const api = axios.create({
  baseURL: BASE,
  timeout: 120000, // 2 minutes — Case File generation calls Gemini + ArmorIQ in series
});

// Attach the logged-in user's email to every request so the backend can scope data
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  const email = session?.user?.email;
  if (email) {
    config.headers["X-Owner-Email"] = email;
  }
  // Also check demo user fallback
  if (!email) {
    try {
      const demo = localStorage.getItem("demo_user");
      if (demo) {
        const d = JSON.parse(demo);
        if (d?.email) config.headers["X-Owner-Email"] = d.email;
      }
    } catch { /* ignore */ }
  }
  return config;
});

export async function callApi<T = unknown>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown
): Promise<{ data: T | null; error: string | null; raw: unknown }> {
  try {
    const res = await api.request<T>({ method, url: path, data: body });
    return { data: res.data, error: null, raw: res.data };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const detail = err.response?.data;
      const msg =
        typeof detail === "string"
          ? detail
          : (detail as { detail?: string })?.detail
          ? JSON.stringify((detail as { detail: unknown }).detail)
          : err.message;
      return { data: null, error: msg, raw: detail };
    }
    return { data: null, error: String(err), raw: null };
  }
}

export const V2 = {
  // MONKEY
  registerAgent: (body: unknown) => callApi("POST", "/v2/agents/register", body),
  generateKeypair: () => callApi("POST", "/v2/agents/keypairs/generate"),
  verifySignature: (body: unknown) => callApi("POST", "/v2/agents/verify-signature", body),
  blacklistAgent: (id: string, body: unknown) => callApi("POST", `/v2/agents/${id}/blacklist`, body),
  deleteAgent: (id: string) => callApi("DELETE", `/v2/agents/${id}`),
  testBlacklisted: (id: string) => callApi("POST", `/v2/agents/${id}/test-blacklisted`),
  sendSigned: (body: unknown) => callApi("POST", "/v2/agents/send-signed", body),
  enclaveCheck: (id: string) => callApi("POST", `/v2/agents/${id}/enclave-check`),
  identityAlerts: () => callApi("GET", "/v2/agents/alerts/identity"),

  // CRANE
  issueToken: (body: unknown) => callApi("POST", "/v2/tokens/issue", body),
  checkScope: (body: unknown) => callApi("POST", "/v2/tokens/check-scope", body),
  initiateProof: (body: unknown) => callApi("POST", "/v2/tokens/proofs/initiate", body),
  signProof: (id: string, body: unknown) => callApi("POST", `/v2/tokens/proofs/${id}/sign`, body),
  proofStatus: (id: string) => callApi("GET", `/v2/tokens/proofs/${id}/status`),
  armoriqGate: (body: unknown) => callApi("POST", "/v2/tokens/armoriq-gate", body),
  multiStep: (body: unknown) => callApi("POST", "/v2/tokens/tasks/multi-step", body),
  verifyExpiry: (body: unknown) => callApi("POST", "/v2/tokens/verify-expiry", body),
  explain: (body: unknown) => callApi("POST", "/v2/tokens/explain", body),

  // SNAKE
  auditLog: (body: unknown) => callApi("POST", "/v2/audit/log", body),
  verifyAuditSig: (id: string) => callApi("POST", `/v2/audit/verify-signature/${id}`),
  verifyChain: () => callApi("POST", "/v2/audit/verify-chain"),
  tamperStatus: () => callApi("GET", "/v2/audit/tamper-status"),
  simulateTamper: () => callApi("POST", "/v2/audit/simulate-tamper"),
  armoriqAuditLog: (body: unknown) => callApi("POST", "/v2/audit/armoriq-log", body),
  merkleCheckpoint: () => callApi("POST", "/v2/audit/merkle-checkpoint"),
  merkleTree: () => callApi("GET", "/v2/audit/merkle-tree"),
  verifyLog: (id: string) => callApi("GET", `/v2/audit/verify/${id}`),

  // MANTIS
  buildBaseline: (body: unknown) => callApi("POST", "/v2/behavior/build-baseline", body),
  peerBaseline: (id: string) => callApi("POST", `/v2/behavior/peer-baseline/${id}`),
  scoreAction: (body: unknown) => callApi("POST", "/v2/behavior/score-action", body),
  geminiPayloadPreview: (body: unknown) => callApi("POST", "/v2/behavior/gemini-payload-preview", body),
  complianceStatus: () => callApi("GET", "/v2/behavior/compliance-status"),
  triggerHoneypotTest: (body: unknown) => callApi("POST", "/v2/behavior/trigger-honeypot-test", body),
  honeypotAction: (body: unknown) => callApi("POST", "/v2/behavior/honeypot-action", body),
  oraclePredict: () => callApi("POST", "/v2/behavior/oracle-predict"),
  liveScores: () => callApi("GET", "/v2/behavior/scores"),
  honeypotChamber: () => callApi("GET", "/v2/behavior/honeypot-chamber"),

  // TIGRESS
  armorclawScan: (body: unknown) => callApi("POST", "/v2/tigress/scan", body),
  jsonInjection: (body: unknown) => callApi("POST", "/v2/tigress/json-injection", body),
  base64Injection: (body: unknown) => callApi("POST", "/v2/tigress/base64-injection", body),
  sessionScan: (body: unknown) => callApi("POST", "/v2/tigress/session-scan", body),
  sessionGraph: (id: string) => callApi("GET", `/v2/tigress/session-graph/${id}`),
  clearSession: (id: string) => callApi("DELETE", `/v2/tigress/session-graph/${id}`),
  ironCage: (id: string) => callApi("POST", `/v2/tigress/iron-cage/${id}`),

  // PO
  poGateway: (body: unknown) => callApi("POST", "/v2/po/gateway", body),
  encryptedSend: (body: unknown) => callApi("POST", "/v2/po/encrypted-send", body),
  newThresholdProof: (body: unknown) => callApi("POST", "/v2/po/threshold-proof/new", body),
  thresholdSign: (proofId: string, idx: number) => callApi("POST", `/v2/po/threshold-sign/${proofId}/${idx}`),
  newFinanceProof: (body: unknown) => callApi("POST", "/v2/po/finance-proof/new", body),
  financeSign: (proofId: string, idx: number) => callApi("POST", `/v2/po/finance-sign/${proofId}/${idx}`),
  trustScores: () => callApi("GET", "/v2/po/trust-scores"),
  commandDashboard: (sector?: string) =>
    callApi("GET", `/v2/po/command-dashboard${sector && sector !== "all" ? `?sector=${sector}` : ""}`),
  riskHistory: (id: string) => callApi("GET", `/v2/po/risk-history/${id}`),
  overviewStats: () => callApi("GET", "/v2/po/overview-stats"),

  // MIRROR
  attack: (name: string, body: unknown) => callApi("POST", `/v2/mirror/attack/${name}`, body),

  // SDK DEMO
  sdkDemo: (mode: "clean" | "injection" | "anomaly", message?: string) =>
    callApi("POST", "/v2/sdk/demo", { mode, message: message ?? "" }),

  // CASE FILE
  caseFile: (agentId: string) => callApi("GET", `/v2/case-file/${agentId}`),

  // COMPLIANCE
  complianceReport: () => callApi("GET", "/v2/compliance/report"),

  // PEER TRUST
  verifyPeer: (body: unknown) => callApi("POST", "/v2/agents/verify-peer", body),

  // HEALTH
  health: () => callApi("GET", "/health"),

  // ── WARDEN SCROLL (MONKEY — M1-M7) ─────────────────────────────────────────
  wardenForgeIdentity: (body: unknown) => callApi("POST", "/v2/warden-scroll/forge-identity", body),
  wardenSealPayload: (body: unknown) => callApi("POST", "/v2/warden-scroll/seal-payload", body),
  wardenBlacklistAlert: (body: unknown) => callApi("POST", "/v2/warden-scroll/blacklist-alert", body),

  // ── TRIBUNAL SCROLL (CRANE — C1-C7) ────────────────────────────────────────
  tribunalIssueToken: (body: unknown) => callApi("POST", "/v2/tribunal-scroll/issue-capability-token", body),
  tribunalScopeGate: (body: unknown) => callApi("POST", "/v2/tribunal-scroll/test-scope-gate", body),
  tribunalJadePalace: (body: unknown) => callApi("POST", "/v2/tribunal-scroll/jade-palace-tribunal", body),

  // ── PEACH TREE SCROLL (SNAKE — S1-S7) ──────────────────────────────────────
  peachSealChain: (body: unknown) => callApi("POST", "/v2/peach-tree-scroll/seal-chain", body),
  peachTriggerTamper: (body: unknown) => callApi("POST", "/v2/peach-tree-scroll/trigger-tamper", body),
  peachCheckpointMerkle: (body: unknown) => callApi("POST", "/v2/peach-tree-scroll/checkpoint-merkle", body),

  // ── ORACLE SCROLL (MANTIS — A1-A9) ─────────────────────────────────────────
  oracleBuildBaseline: (body: unknown) => callApi("POST", "/v2/oracle-scroll/build-baseline", body),
  oracleSimulateAttack: (body: unknown) => callApi("POST", "/v2/oracle-scroll/simulate-attack", body),
  oracleInvokeOracle: (body: unknown) => callApi("POST", "/v2/oracle-scroll/invoke-oracle", body),

  // ── IRON CAGE SCROLL (TIGRESS — T1-T6) ─────────────────────────────────────
  ironCleanScan: (body?: unknown) => callApi("POST", "/v2/iron-cage-scroll/clean-scan", body ?? {}),
  ironInjectionGauntlet: () => callApi("POST", "/v2/iron-cage-scroll/injection-gauntlet"),
  ironMultiTurnDrift: (body?: unknown) => callApi("POST", "/v2/iron-cage-scroll/multi-turn-drift", body ?? {}),

  // ── DRAGON SCROLL (PO — P1-P11) ────────────────────────────────────────────
  dragonBftConsensus: (body: unknown) => callApi("POST", "/v2/po/bft-consensus-demo", body),
  dragonFinancialMultisign: (body: unknown) => callApi("POST", "/v2/po/financial-multisign-demo", body),

  // ── SDK ─────────────────────────────────────────────────────────────────────
  sdkWrapDemo: (body: unknown) => callApi("POST", "/v2/sdk/wrap-demo", body),
  sdkDownloadUrl: () => `${import.meta.env.VITE_API_BASE ?? ""}/v2/sdk/download`,
};

export type Agent = {
  agent_id: string;
  name: string;
  sector: string;
  trust_score: number;
  blacklisted: boolean;
  created_at: string;
};
