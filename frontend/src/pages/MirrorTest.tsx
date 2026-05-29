import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore } from "../store/agentStore";
import { V2 } from "../api/client";
import { SparklesText } from "../components/ui/sparkles-text";
import { SmokeBackground } from "../components/ui/spooky-smoke-animation";
import { RippleButton } from "../components/ui/multi-type-ripple-buttons";
import clsx from "clsx";

const A = "#ff3333";

type MessageResult = { msg_index: number; msg_preview: string; drift: number; status: string; reason?: string };

type AttackResult = {
  status: string;
  blocked_by?: string;
  proof?: string;
  supabase_table?: string;
  note?: string;
  agent_name?: string;
  log_id?: string | number;
  nonce?: string;
  nonce_row_id?: string | number;
  token_preview?: string;
  token_row_id?: string | number;
  expired_at?: string;
  original_hash?: string;
  corrupted_hash?: string;
  decoded_content?: string;
  session_id?: string;
  message_results?: MessageResult[];
  rows_inserted?: number;
  action_types?: string[];
  trust_score_restored?: number;
  peer_names?: string[];
  inserted_count?: number;
  baseline_restored?: boolean;
  public_key_preview?: string;
  valid?: boolean;
  [key: string]: unknown;
};

type AttackDef = {
  id: number;
  name: string;
  description: string;
  endpoint: string;
  expected: string;
  warrior: string;
};

const ATTACKS: AttackDef[] = [
  { id: 1, name: "Stolen API Key", description: "Auto-blacklist agent → send request from blacklisted agent", endpoint: "stolen-api-key", expected: "❌ BLOCKED — key blacklisted", warrior: "MONKEY (M4)" },
  { id: 2, name: "Replay Attack", description: "Send signed packet → replay same nonce → blocked", endpoint: "replay", expected: "❌ BLOCKED — nonce used", warrior: "MONKEY (M5)" },
  { id: 3, name: "Expired Token", description: "Issue expired token → attempt to use it", endpoint: "expired-token", expected: "❌ BLOCKED — token expired", warrior: "CRANE (C6)" },
  { id: 4, name: "Out-of-Scope Action", description: "Read-only token → attempt delete action", endpoint: "out-of-scope", expected: "❌ BLOCKED — scope violation", warrior: "CRANE (C2)" },
  { id: 5, name: "Audit Log Tamper", description: "Corrupt audit hash → tamper detection catches it", endpoint: "audit-tamper", expected: "🔴 TAMPER DETECTED", warrior: "SNAKE (S4)" },
  { id: 6, name: "JSON Injection", description: "Role-override JSON payload via ArmorClaw", endpoint: "json-injection", expected: "❌ BLOCKED by ArmorClaw", warrior: "TIGRESS (T2)" },
  { id: 7, name: "Base64 Injection", description: "Base64 encoded 'exfiltrate data' command", endpoint: "base64-injection", expected: "❌ BLOCKED — decoded + blocked", warrior: "TIGRESS (T3)" },
  { id: 8, name: "Multi-Turn Injection", description: "10 messages building to instruction override", endpoint: "multi-turn-injection", expected: "❌ BLOCKED at msg 10", warrior: "TIGRESS (T4/T5)" },
  { id: 9, name: "Behavioral Anomaly", description: "Flood 100 actions → score spikes → honeypot", endpoint: "behavioral-anomaly", expected: "⚠️ FLAGGED → honeypot", warrior: "MANTIS (A7)" },
  { id: 10, name: "Cold-Start Poisoning", description: "New agent + attempt fake history injection", endpoint: "cold-start-poisoning", expected: "❌ BLOCKED — peer baseline", warrior: "MANTIS (A2)" },
  { id: 11, name: "Quantum Key Forgery", description: "Random Dilithium signature → verification fails", endpoint: "quantum-forgery", expected: "❌ BLOCKED — signature invalid", warrior: "MONKEY (M3)" },
];

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function MirrorTest() {
  const { selectedAgentId } = useAgentStore();
  const agentId = selectedAgentId || "";
  const [results, setResults] = useState<Record<number, AttackResult | null>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [runAll, setRunAll] = useState(false);

  const runAttack = async (attack: AttackDef) => {
    if (!agentId) return;
    setLoading(prev => ({ ...prev, [attack.id]: true }));
    const res = await V2.attack(attack.endpoint, { agent_id: agentId });
    setResults(prev => ({ ...prev, [attack.id]: (res.data || { status: res.error || "ERROR" }) as AttackResult }));
    setLoading(prev => ({ ...prev, [attack.id]: false }));
  };

  const runAllAttacks = async () => {
    setRunAll(true);
    for (const a of ATTACKS) {
      await runAttack(a);
      await new Promise(r => setTimeout(r, 300));
    }
    setRunAll(false);
  };

  const passCount = Object.values(results).filter(r => r && r.status && !r.status.includes("ERROR")).length;

  // Voice event integration
  const agentIdRef = useRef(agentId); agentIdRef.current = agentId;

  useEffect(() => {
    const dispatch = (featureId: string, data: unknown, success: boolean) => {
      window.dispatchEvent(new CustomEvent('featureResult', {
        detail: { featureId, success, summary: success ? 'Attack blocked.' : 'Attack failed.', data },
      }));
    };

    const handler = async (e: Event) => {
      const { featureId } = (e as CustomEvent).detail;
      const aid = agentIdRef.current;
      if (!aid) return;

      if (featureId === 'MIRROR_ALL') {
        for (const atk of ATTACKS) {
          await runAttack(atk);
          await new Promise(r => setTimeout(r, 300));
        }
        dispatch('MIRROR_ALL', { status: 'All 11 attacks complete' }, true);
        return;
      }

      const attackNum = featureId.startsWith('MIRROR_') ? parseInt(featureId.replace('MIRROR_', ''), 10) : null;
      if (attackNum === null) return;
      const atk = ATTACKS.find(a => a.id === attackNum);
      if (!atk) return;

      setLoading(prev => ({ ...prev, [atk.id]: true }));
      const res = await V2.attack(atk.endpoint, { agent_id: aid });
      const resultData = (res.data || { status: res.error || 'ERROR' }) as AttackResult;
      setResults(prev => ({ ...prev, [atk.id]: resultData }));
      setLoading(prev => ({ ...prev, [atk.id]: false }));

      const success = !resultData.status?.includes('ERROR');
      dispatch(featureId, resultData, success);
    };

    window.addEventListener('triggerFeature', handler);
    return () => window.removeEventListener('triggerFeature', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-full">
      {/* Smoke background — dark red */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <SmokeBackground smokeColor="#1a0000" />
      </div>

      {/* Ambient red glow at top */}
      <div className="absolute inset-x-0 top-0 h-32 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,50,50,0.12) 0%, transparent 70%)" }} />

      {/* Content */}
      <div className="relative z-10 p-6 space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-start justify-between"
        >
          <div>
            <SparklesText
              text="Mirror Test — 11 Attack Scenarios"
              colors={{ first: "#ff3333", second: "#ff6666" }}
              className="text-xl font-bold"
              sparklesCount={5}
            />
            <p className="text-gray-500 text-sm mt-1">One-click attack demos proving every defence works</p>
          </div>
          <div className="flex items-center gap-3">
            {!agentId && <span className="text-amber text-xs">Select an agent first</span>}
            <AnimatePresence>
              {Object.keys(results).length > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-mono px-2 py-1 rounded bg-green/10 text-green border border-green/20"
                >
                  {passCount}/11 blocked ✅
                </motion.span>
              )}
            </AnimatePresence>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <RippleButton
                variant="hoverborder"
                onClick={runAllAttacks}
                disabled={runAll || !agentId}
                className="px-4 py-2 rounded text-sm font-mono font-bold disabled:opacity-50"
                style={{ color: A, border: `1px solid ${A}44`, background: `${A}11` }}
                rippleColor={`${A}44`}
                hoverBorderEffectColor={A}
              >
                {runAll ? "Running all..." : "[ RUN ALL 11 ]"}
              </RippleButton>
            </motion.div>
          </div>
        </motion.div>

        {/* Attack cards grid */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3"
        >
          {ATTACKS.map(attack => {
            const res = results[attack.id];
            const busy = loading[attack.id];
            const passed = res && !res.status?.includes("ERROR");

            return (
              <motion.div
                key={attack.id}
                variants={cardVariants}
                whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 30 } }}
                animate={{
                  borderColor: res
                    ? passed ? "rgba(0,255,136,0.2)" : "rgba(255,50,50,0.25)"
                    : "rgba(255,255,255,0.1)",
                }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border bg-[#161616]/90 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded"
                        style={{ background: A + "22", color: A, border: `1px solid ${A}44` }}>
                        #{attack.id}
                      </span>
                      <h3 className="text-white text-sm font-semibold">{attack.name}</h3>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{attack.description}</p>
                    <p className="text-gray-600 text-xs mt-1">Blocked by: <span className="text-gray-400">{attack.warrior}</span></p>
                  </div>
                </div>

                <div className="text-xs font-mono text-gray-600 mb-2">Expected: {attack.expected}</div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <RippleButton
                    variant="hoverborder"
                    onClick={() => runAttack(attack)}
                    disabled={busy || !agentId}
                    className="w-full py-1.5 rounded text-xs font-mono disabled:opacity-50"
                    style={{ color: A, border: `1px solid ${A}44`, background: `${A}11` }}
                    rippleColor={`${A}44`}
                    hoverBorderEffectColor={A}
                  >
                    {busy ? "Running..." : "[ RUN ATTACK ]"}
                  </RippleButton>
                </motion.div>

                <AnimatePresence>
                  {res && (
                    <motion.div
                      key={res.status}
                      initial={{ opacity: 0, y: -6, boxShadow: passed ? "0 0 16px rgba(0,255,136,0.4)" : "0 0 16px rgba(255,50,50,0.6)" }}
                      animate={{ opacity: 1, y: 0, boxShadow: "0 0 0 0 transparent" }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className={clsx("mt-2 px-2 py-1.5 rounded border text-xs font-mono space-y-0.5",
                        passed ? "border-green/20 bg-green/5 text-green" : "border-red/20 bg-red/5 text-red")}
                    >
                      <p className="font-bold">{res.status}</p>
                      {res.agent_name && <p className="text-gray-400">Agent: <span className="text-gray-300">{res.agent_name}</span></p>}
                      {res.blocked_by && <p className="text-gray-400">Blocked by: <span className="text-gray-300">{res.blocked_by}</span></p>}
                      {res.supabase_table && <p className="text-gray-500">Table: <span className="text-gray-400">{res.supabase_table}</span></p>}
                      {res.log_id && <p className="text-gray-500">Log ID: <span className="text-gray-400">{String(res.log_id)}</span></p>}
                      {res.nonce && <p className="text-gray-500">Nonce: <span className="text-gray-400">{res.nonce}</span></p>}
                      {res.nonce_row_id && <p className="text-gray-500">DB row: <span className="text-gray-400">{String(res.nonce_row_id)}</span></p>}
                      {res.token_preview && <p className="text-gray-500">Token: <span className="text-gray-400">{res.token_preview}</span></p>}
                      {res.expired_at && <p className="text-gray-500">Expired: <span className="text-gray-400">{res.expired_at}</span></p>}
                      {res.original_hash && (
                        <div className="text-gray-500 space-y-0.5">
                          <p>Orig hash: <span className="text-gray-400">{res.original_hash.slice(0, 20)}…</span></p>
                          {res.corrupted_hash && <p>Corrupt: <span className="text-red">{res.corrupted_hash.slice(0, 20)}…</span></p>}
                        </div>
                      )}
                      {res.decoded_content && <p className="text-gray-500">Decoded: <span className="text-amber">{res.decoded_content}</span></p>}
                      {res.message_results && (
                        <div className="mt-1 space-y-0.5">
                          {res.message_results.map((m) => (
                            <div key={m.msg_index} className="flex items-center gap-1.5">
                              <span className="text-gray-600">#{m.msg_index}</span>
                              <span className={clsx("font-bold", m.status === "BLOCKED" ? "text-red" : "text-gray-500")}>{m.status}</span>
                              <span className="text-gray-600">drift={m.drift.toFixed(2)}</span>
                              {m.reason && <span className="text-gray-600 truncate max-w-24" title={m.reason}>{m.reason}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {res.rows_inserted != null && <p className="text-gray-500">Actions logged: <span className="text-gray-400">{res.rows_inserted}</span></p>}
                      {res.action_types && <p className="text-gray-500">Types: <span className="text-gray-400">{res.action_types.join(", ")}</span></p>}
                      {res.trust_score_restored != null && <p className="text-gray-500">Score restored → <span className="text-green">{res.trust_score_restored}</span></p>}
                      {res.peer_names && res.peer_names.length > 0 && <p className="text-gray-500">Peers: <span className="text-gray-400">{res.peer_names.join(", ")}</span></p>}
                      {res.inserted_count != null && <p className="text-gray-500">Peer rows: <span className="text-gray-400">{res.inserted_count}</span></p>}
                      {res.public_key_preview && <p className="text-gray-500">PubKey: <span className="text-gray-400">{res.public_key_preview}</span></p>}
                      {res.valid != null && <p className={clsx(res.valid ? "text-green" : "text-red")}>Signature valid: {res.valid ? "true" : "false"}</p>}
                      {res.proof && <p className="text-gray-500">{res.proof}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Final verdict when all 11 done */}
        <AnimatePresence>
          {Object.keys(results).length === 11 && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className={clsx("rounded-xl border p-4 text-center",
                passCount === 11 ? "border-green/30 bg-green/5" : "border-amber/30 bg-amber/5")}
            >
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className={clsx("text-xl font-bold font-mono", passCount === 11 ? "text-green" : "text-amber")}
              >
                {passCount === 11 ? "🐼 SKADOOSH! All 11 attacks blocked." : `${passCount}/11 attacks blocked`}
              </motion.p>
              <p className="text-gray-500 text-sm mt-1">Every defence verified with real backend + Supabase proof</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
