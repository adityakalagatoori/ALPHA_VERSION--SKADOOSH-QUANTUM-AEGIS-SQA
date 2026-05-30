import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { SparklesText } from "../components/ui/sparkles-text";
import { V2 } from "../api/client";

// ── Warrior accent colors ──────────────────────────────────────────────────────
const W = {
  MONKEY:  "#ffd700",
  CRANE:   "#4488ff",
  SNAKE:   "#00ff88",
  MANTIS:  "#ff44aa",
  TIGRESS: "#ff6600",
  PO:      "#e0e0e0",
} as const;

// ── All 47 features ───────────────────────────────────────────────────────────
const ALL_FEATURES: Record<string, { code: string; name: string }[]> = {
  MONKEY:  [
    { code: "M1", name: "Kyber-1024 Keypair Generation" },
    { code: "M2", name: "Quantum Entropy Seed (liboqs)" },
    { code: "M3", name: "Dilithium Signature Gate" },
    { code: "M4", name: "Agent Key Blacklisting" },
    { code: "M5", name: "Replay-Sealed Payloads" },
    { code: "M6", name: "Secure Enclave Shield" },
    { code: "M7", name: "Oogway's Alert Signal" },
  ],
  CRANE:   [
    { code: "C1", name: "JWT Capability Tokens (5-min expiry)" },
    { code: "C2", name: "Out-of-Scope Action Blocker" },
    { code: "C3", name: "MultiSig Capability Proofs" },
    { code: "C4", name: "ArmorIQ as Second Policy Gate" },
    { code: "C5", name: "Mid-Execution Checkpoint" },
    { code: "C6", name: "Token Expiry Halt" },
    { code: "C7", name: "Jade Palace Tribunal (SHAP)" },
  ],
  SNAKE:   [
    { code: "S1", name: "SHA-3-256 Immutable Audit Ledger" },
    { code: "S2", name: "Dilithium-3 Quantum Audit Signatures" },
    { code: "S3", name: "Hash Chain Integrity" },
    { code: "S4", name: "Live Tamper Detection (60-sec)" },
    { code: "S5", name: "ArmorIQ Writes Directly" },
    { code: "S6", name: "Merkle Tree Checkpoints" },
    { code: "S7", name: "Sacred Peach Tree Visual" },
  ],
  MANTIS:  [
    { code: "A1", name: "50-Action Behavioral Baseline" },
    { code: "A2", name: "Peer-Class Lattice Baseline" },
    { code: "A3", name: "Real-Time Risk Scoring (0–100)" },
    { code: "A4", name: "Guardrailed Gemini Analysis" },
    { code: "A5", name: "Gemini Under Signed BAA" },
    { code: "A6", name: "On-Prem LLM Fallback" },
    { code: "A7", name: "Auto-Honeypot Routing (score > 90)" },
    { code: "A8", name: "Honeypot Isolation Chamber" },
    { code: "A9", name: "Oracle Scroll CVE Prediction" },
  ],
  TIGRESS: [
    { code: "T1", name: "ArmorClaw Full Message Scan" },
    { code: "T2", name: "JSON Injection Detection" },
    { code: "T3", name: "Base64 & URL Injection Block" },
    { code: "T4", name: "Session-Graph Semantic Hash" },
    { code: "T5", name: "Multi-Turn Injection Drift" },
    { code: "T6", name: "Iron Cage Honeypot Routing" },
  ],
  PO:      [
    { code: "P1",  name: "Central Message Gateway" },
    { code: "P2",  name: "5-Warrior Sequential Checks" },
    { code: "P3",  name: "Final Verdict: DELIVER or KILL" },
    { code: "P4",  name: "Kyber-1024 Encrypted Channels" },
    { code: "P5",  name: "3-of-5 Dilithium BFT Signing" },
    { code: "P6",  name: "Live Trust Score Network" },
    { code: "P7",  name: "Dilithium Financial Signing" },
    { code: "P8",  name: "Security Command Dashboard" },
    { code: "P9",  name: "Global Sector Filter" },
    { code: "P10", name: "Tamper-Proof Logs Display" },
    { code: "P11", name: "Live Risk Scoring Display" },
  ],
};

// ── Features lit by each step ─────────────────────────────────────────────────
const STEP_LIT: Record<number, string[]> = {
  1: ["M1","M2","M3","M6"],
  2: ["C1","C2","C3","C4"],
  3: ["S1","S2","S3","S5","S6"],
  4: ["A1","A2","A3","A4","A7","A8"],
  5: ["T1","T2","T3","T4","T5"],
  6: ["P1","P2","P3","P5","P6"],
};

// ── Step definitions ──────────────────────────────────────────────────────────
interface StepDef {
  number: number;
  warrior: keyof typeof W;
  title: string;
  pitch: string;
  button: string;
  after: string;
  action: (agentId: string) => Promise<unknown>;
}

const STEPS: StepDef[] = [
  {
    number: 1,
    warrior: "MONKEY",
    title: "Quantum-Proof Agent Identity",
    pitch: "Every AI agent gets a post-quantum cryptographic identity the moment it registers. NSA-approved algorithms — live-generated on the server.",
    button: "Forge Agent Identity",
    after: "Agent ID locked in — every remaining step uses this agent's identity.",
    action: () => V2.wardenForgeIdentity({ name: "demo-agent-" + Math.random().toString(36).slice(2,6), sector: "banking" }),
  },
  {
    number: 2,
    warrior: "CRANE",
    title: "Capability Tokens + Hard Scope Block",
    pitch: "The agent receives a signed JWT listing exactly what it can do. Any attempt outside that list is cryptographically blocked — not politely refused.",
    button: "Issue Token + Block Out-of-Scope Action",
    after: "Agents cannot exceed their mandate. Scope enforcement is cryptographic.",
    action: (agentId) => V2.tribunalScopeGate({
      agent_id: agentId || "DEMO-AGENT",
      allowed_action: "read",
      blocked_action: "admin_delete",
    }),
  },
  {
    number: 3,
    warrior: "SNAKE",
    title: "Quantum-Signed Immutable Audit Chain",
    pitch: "Every action, decision, and alert is written into a SHA-3-256 hash chain. Each entry is Dilithium-3 signed. You cannot alter history without breaking the chain.",
    button: "Seal Audit Chain",
    after: "3 hash-chained entries written. Merkle root computed. Dilithium signatures verified.",
    action: (agentId) => V2.peachSealChain({ agent_id: agentId || "DEMO-AGENT" }),
  },
  {
    number: 4,
    warrior: "MANTIS",
    title: "Behavioral AI — Attack Detected, Honeypot Activated",
    pitch: "MANTIS learned what normal looks like for this agent. Now we simulate a malicious action — it scores it 0–100 for threat level, asks Gemini AI to explain the risk, and silently routes the attacker to a honeypot.",
    button: "Simulate Malicious Attack",
    after: "Risk score generated. Gemini analysis returned. Agent auto-routed to honeypot.",
    action: (agentId) => V2.oracleSimulateAttack({ agent_id: agentId || "DEMO-AGENT" }),
  },
  {
    number: 5,
    warrior: "TIGRESS",
    title: "Semantic Injection Attacks — All Blocked",
    pitch: "Attackers craft malicious AI messages disguised as normal requests — JSON injection, Base64-encoded payloads, multi-turn drift attacks. ArmorClaw scans the semantic intent, not just the syntax.",
    button: "Launch Injection Gauntlet",
    after: "JSON injection, Base64 encoding, and multi-turn drift — all caught by ArmorClaw.",
    action: (agentId) => V2.ironInjectionGauntlet({ agent_id: agentId || "DEMO-AGENT" }),
  },
  {
    number: 6,
    warrior: "PO",
    title: "Dragon Warrior Pipeline — Final Verdict",
    pitch: "Every message that enters the system passes through all 5 warrior security checks in sequence. PO orchestrates the entire pipeline and delivers a final cryptographic verdict: DELIVER or KILL.",
    button: "Run Dragon Warrior Pipeline",
    after: "All 5 warrior checks fired. BFT consensus reached. Final verdict issued.",
    action: (agentId) => V2.poGateway({
      agent_id: agentId || "DEMO-AGENT",
      message: "Transfer $500,000 to VAULT-DEMO account for quarterly settlement",
      simulate_attack: false,
    }),
  },
];

// ── Terminal output formatter ─────────────────────────────────────────────────
function flatLines(data: unknown, depth = 0, prefix = ""): { key: string; value: string }[] {
  if (!data || typeof data !== "object" || depth > 2) return [];
  const lines: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (k === "html" || k === "css") continue;
    const label = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      const display = String(v).length > 72 ? String(v).slice(0, 72) + "…" : String(v);
      lines.push({ key: label, value: display });
    } else if (v && typeof v === "object" && depth < 2) {
      lines.push(...flatLines(v, depth + 1, label));
    }
    if (lines.length >= 12) break;
  }
  return lines;
}

function TerminalOutput({ data, accent }: { data: unknown; accent: string }) {
  const lines = flatLines(data);
  if (!lines.length) return null;
  return (
    <div
      className="rounded-xl p-4 font-mono text-xs space-y-1 max-h-52 overflow-y-auto mt-4"
      style={{ background: "rgba(0,0,0,0.7)", border: `1px solid ${accent}22` }}
    >
      {lines.map((l, i) => (
        <div key={i} className="flex gap-3 items-start">
          <span className="text-gray-500 shrink-0 w-36 truncate">{l.key}</span>
          <span style={{ color: accent }} className="break-all leading-relaxed">{l.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Feature matrix ────────────────────────────────────────────────────────────
function FeatureMatrix({ litCodes }: { litCodes: Set<string> }) {
  return (
    <div className="mt-10 rounded-2xl border border-white/10 bg-black/30 p-6">
      <p className="text-xs font-bold tracking-widest text-gray-500 mb-5 uppercase">All 47 Features</p>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        {Object.entries(ALL_FEATURES).map(([warrior, features]) => {
          const accent = W[warrior as keyof typeof W];
          return (
            <div key={warrior}>
              <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: accent }}>{warrior}</p>
              <div className="flex flex-wrap gap-1.5">
                {features.map(({ code, name }) => {
                  const lit = litCodes.has(code);
                  return (
                    <span
                      key={code}
                      title={name}
                      className="text-xs px-1.5 py-0.5 rounded font-mono cursor-default transition-all duration-500"
                      style={{
                        background: lit ? `${accent}22` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${lit ? accent + "55" : "rgba(255,255,255,0.08)"}`,
                        color: lit ? accent : "#555",
                        boxShadow: lit ? `0 0 8px ${accent}44` : "none",
                      }}
                    >
                      {code}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step card ─────────────────────────────────────────────────────────────────
interface StepCardProps {
  step: StepDef;
  state: "locked" | "active" | "done";
  result: unknown;
  error: string | null;
  loading: boolean;
  onRun: () => void;
  onNext: () => void;
}

function StepCard({ step, state, result, error, loading, onRun, onNext }: StepCardProps) {
  const accent = W[step.warrior];
  const locked = state === "locked";
  const done = state === "done";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: locked ? 0.35 : 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${done ? "#00ff8840" : locked ? "rgba(255,255,255,0.06)" : accent + "50"}`,
        background: "rgba(10,10,18,0.8)",
        boxShadow: done ? "none" : locked ? "none" : `0 0 40px ${accent}12`,
        pointerEvents: locked ? "none" : "auto",
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{
          borderBottom: `1px solid ${locked ? "rgba(255,255,255,0.05)" : accent + "25"}`,
          background: `${accent}08`,
        }}
      >
        <div className="flex items-center gap-4">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
            style={{
              background: done ? "#00ff8820" : locked ? "rgba(255,255,255,0.06)" : `${accent}20`,
              border: `1px solid ${done ? "#00ff8855" : locked ? "rgba(255,255,255,0.1)" : accent + "60"}`,
              color: done ? "#00ff88" : locked ? "#444" : accent,
            }}
          >
            {done ? "✓" : step.number}
          </span>
          <div>
            <p className="text-xs font-bold tracking-widest mb-0.5" style={{ color: locked ? "#444" : accent }}>
              STEP {step.number} · {step.warrior}
            </p>
            <p className="text-sm font-bold text-white">{step.title}</p>
          </div>
        </div>
        {done && (
          <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: "#00ff8815", color: "#00ff88", border: "1px solid #00ff8840" }}>
            Complete
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-6">
        <p className="text-sm text-gray-400 leading-relaxed mb-5">{step.pitch}</p>

        {/* Action button */}
        {!done && (
          <motion.button
            whileHover={loading ? {} : { scale: 1.02 }}
            whileTap={loading ? {} : { scale: 0.98 }}
            onClick={onRun}
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-black tracking-wide transition-all"
            style={{
              background: loading ? `${accent}40` : accent,
              color: accent === W.PO || accent === W.CRANE ? "#000" : "#000",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/40 border-t-black/80 rounded-full animate-spin" />
                Running live on server…
              </span>
            ) : step.button}
          </motion.button>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mt-4 rounded-xl px-4 py-3 text-xs font-mono text-red-400 bg-red-900/20 border border-red-700/30">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            <TerminalOutput data={result} accent={accent} />
            <p className="text-xs text-gray-600 mt-4 leading-relaxed italic">{step.after}</p>
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNext}
              className="mt-5 w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: `${accent}18`, border: `1px solid ${accent}40`, color: accent }}
            >
              {step.number < 6 ? `Step ${step.number + 1}: ${STEPS[step.number].warrior} →` : "Complete the Trial →"}
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Completion overlay ────────────────────────────────────────────────────────
function CompletionScreen({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
    >
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        numberOfPieces={320}
        colors={[W.MONKEY, W.CRANE, W.SNAKE, W.MANTIS, W.TIGRESS, "#a78bfa"]}
        recycle={false}
      />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
        className="text-center max-w-xl px-8 z-10"
      >
        <div className="text-6xl mb-6">🐼</div>
        <SparklesText
          text="TRIAL COMPLETE"
          colors={{ first: "#a78bfa", second: "#ffd700" }}
          className="text-4xl font-black mb-3"
          sparklesCount={14}
        />
        <p className="text-gray-400 text-lg mb-2">All 47 features demonstrated.</p>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Post-quantum identity · Scope enforcement · Immutable audit chain ·
          Behavioral AI · Semantic defense · Orchestrated pipeline
        </p>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Warriors Deployed", value: "6", color: W.MONKEY },
            { label: "Features Covered", value: "47", color: W.CRANE },
            { label: "Real API Calls", value: "6", color: W.SNAKE },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{ background: `${s.color}12`, border: `1px solid ${s.color}30` }}
            >
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={onReset}
          className="w-full py-3.5 rounded-xl font-bold text-sm"
          style={{ background: "#a78bfa", color: "#000" }}
        >
          Reset Demo
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Main Guide page ───────────────────────────────────────────────────────────
export function Guide() {
  const [agentId, setAgentId] = useState("");
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<Record<number, unknown>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [showCompletion, setShowCompletion] = useState(false);

  const litCodes = new Set(
    [...completedSteps].flatMap((s) => STEP_LIT[s] ?? [])
  );

  const runStep = useCallback(async (stepNum: number) => {
    const step = STEPS[stepNum - 1];
    setLoading((p) => ({ ...p, [stepNum]: true }));
    setErrors((p) => ({ ...p, [stepNum]: "" }));
    try {
      const res = await step.action(agentId);
      const data = (res as { data: unknown }).data ?? res;
      setResults((p) => ({ ...p, [stepNum]: data }));
      // Capture agent_id from step 1
      if (stepNum === 1) {
        const id = (data as Record<string, unknown>)?.agent_id as string;
        if (id) setAgentId(id);
      }
    } catch (e: unknown) {
      setErrors((p) => ({ ...p, [stepNum]: e instanceof Error ? e.message : String(e) }));
    } finally {
      setLoading((p) => ({ ...p, [stepNum]: false }));
    }
  }, [agentId]);

  const completeStep = useCallback((stepNum: number) => {
    setCompletedSteps((prev) => new Set([...prev, stepNum]));
    if (stepNum < 6) {
      setActiveStep(stepNum + 1);
    } else {
      setShowCompletion(true);
    }
  }, []);

  const reset = useCallback(() => {
    setAgentId("");
    setActiveStep(1);
    setCompletedSteps(new Set());
    setResults({});
    setErrors({});
    setLoading({});
    setShowCompletion(false);
  }, []);

  const progress = (completedSteps.size / 6) * 100;

  return (
    <div
      className="relative min-h-full"
      style={{ background: "#060410" }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at 15% 10%, rgba(167,139,250,0.06) 0%, transparent 55%), radial-gradient(ellipse at 85% 90%, rgba(68,136,255,0.04) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 p-6 max-w-4xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SparklesText
            text="THE DRAGON WARRIOR'S TRIAL"
            colors={{ first: "#a78bfa", second: "#ffd700" }}
            className="text-2xl font-black tracking-tight"
            sparklesCount={10}
          />
          <p className="text-gray-500 text-sm mt-1">
            SQA · 6 steps · 47 features · all real API calls · 3-minute interactive demo
          </p>

          {/* Progress indicator */}
          <div className="mt-5 flex items-center gap-3">
            {STEPS.map((s) => {
              const done = completedSteps.has(s.number);
              const active = s.number === activeStep && !done;
              const accent = W[s.warrior];
              return (
                <div key={s.number} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300"
                      style={{
                        background: done ? "#00ff8820" : active ? `${accent}25` : "rgba(255,255,255,0.05)",
                        border: `2px solid ${done ? "#00ff88" : active ? accent : "rgba(255,255,255,0.1)"}`,
                        color: done ? "#00ff88" : active ? accent : "#444",
                        boxShadow: active ? `0 0 12px ${accent}55` : "none",
                      }}
                    >
                      {done ? "✓" : s.number}
                    </div>
                    <span className="text-xs font-bold" style={{ color: done ? "#00ff88" : active ? accent : "#333" }}>
                      {s.warrior}
                    </span>
                  </div>
                  {s.number < 6 && (
                    <div
                      className="h-0.5 w-6 rounded transition-all duration-500"
                      style={{ background: completedSteps.has(s.number) ? "#00ff8860" : "rgba(255,255,255,0.08)" }}
                    />
                  )}
                </div>
              );
            })}
            <div className="ml-auto flex items-center gap-3">
              <div className="text-xs text-gray-600 font-mono">{completedSteps.size}/6 steps</div>
              <button
                onClick={reset}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: "#666", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #a78bfa, #ffd700)" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {/* ── Step cards ──────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {STEPS.map((step) => {
            const done = completedSteps.has(step.number);
            const locked = step.number > activeStep && !done;
            const state: "locked" | "active" | "done" = done ? "done" : locked ? "locked" : "active";
            return (
              <StepCard
                key={step.number}
                step={step}
                state={state}
                result={results[step.number]}
                error={errors[step.number] || null}
                loading={!!loading[step.number]}
                onRun={() => runStep(step.number)}
                onNext={() => completeStep(step.number)}
              />
            );
          })}
        </div>

        {/* ── Feature matrix ───────────────────────────────────────────────── */}
        <FeatureMatrix litCodes={litCodes} />

        {/* ── Footer note ──────────────────────────────────────────────────── */}
        <p className="text-center text-xs text-gray-700 pb-8">
          Every button calls a live backend server. Every response is real data from Supabase, ArmorIQ, ArmorClaw, and Google Gemini 2.0 Flash.
        </p>
      </div>

      {/* ── Completion overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCompletion && <CompletionScreen onReset={reset} />}
      </AnimatePresence>
    </div>
  );
}
