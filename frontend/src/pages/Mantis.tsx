import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeatureCard, useFeature } from "../components/FeatureCard";
import { useAgentStore } from "../store/agentStore";
import { V2 } from "../api/client";
import { usePolling } from "../hooks/usePolling";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { SparklesText } from "../components/ui/sparkles-text";

const A = "#00ccaa";

const ACTION_TYPES = ["read", "write", "delete", "transfer", "approve", "query", "mass_read", "privilege_escalate"];

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function RiskGauge({ score }: { score: number }) {
  const color = score >= 90 ? "#ff3333" : score >= 70 ? "#ff6600" : score >= 50 ? "#ffaa00" : "#00ff88";
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
          <motion.circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold font-mono" style={{ color }}>{score}</span>
        </div>
      </div>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export function Mantis() {
  const { selectedAgentId } = useAgentStore();
  const agentId = selectedAgentId || "";

  const a1 = useFeature();
  const a2 = useFeature();

  const a3 = useFeature();
  const [a3action, setA3action] = useState("read");

  const { data: scores } = usePolling<{ scores: { timestamp: string; risk_score: number; action_type: string }[] }>(
    () => V2.liveScores() as Promise<{ data: { scores: unknown[] } | null; error: string | null }>, 3000);

  const a4 = useFeature();
  const [a4action, setA4action] = useState("delete");

  const a5 = useFeature();

  const [offlineMode, setOfflineMode] = useState(false);
  const a6 = useFeature();

  const a7 = useFeature();
  const a8 = useFeature();
  const a9 = useFeature();

  const [a7Flash, setA7Flash] = useState(false);
  const prevA7Result = useRef<unknown>(null);

  useEffect(() => {
    if (a7.result && a7.result !== prevA7Result.current) {
      setA7Flash(true);
      prevA7Result.current = a7.result;
      const t = setTimeout(() => setA7Flash(false), 1500);
      return () => clearTimeout(t);
    }
  }, [a7.result]);

  const agentScores = (scores?.scores || []).filter(s => (s as { agent_id?: string }).agent_id === agentId);

  // Refs for voice event handler
  const a1r = useRef(a1); a1r.current = a1;
  const a2r = useRef(a2); a2r.current = a2;
  const a3r = useRef(a3); a3r.current = a3;
  const a4r = useRef(a4); a4r.current = a4;
  const a5r = useRef(a5); a5r.current = a5;
  const a6r = useRef(a6); a6r.current = a6;
  const a7r = useRef(a7); a7r.current = a7;
  const a8r = useRef(a8); a8r.current = a8;
  const a9r = useRef(a9); a9r.current = a9;
  const agentIdRef = useRef(agentId); agentIdRef.current = agentId;

  useEffect(() => {
    const dispatch = (featureId: string, data: unknown, success: boolean) => {
      window.dispatchEvent(new CustomEvent('featureResult', {
        detail: { featureId, success, summary: success ? 'Complete.' : 'Failed.', data },
      }));
    };

    const handler = async (e: Event) => {
      const { featureId, inputs } = (e as CustomEvent).detail;
      const aid = agentIdRef.current;

      if (featureId === 'A1') {
        const data = await a1r.current.run(() => V2.buildBaseline({ agent_id: aid }));
        dispatch('A1', data, data !== null);
      } else if (featureId === 'A2') {
        const data = await a2r.current.run(() => V2.peerBaseline(aid));
        dispatch('A2', data, data !== null);
      } else if (featureId === 'A3') {
        const act = inputs?.action || 'read';
        setA3action(act);
        const data = await a3r.current.run(() => V2.scoreAction({ agent_id: aid, action_type: act, mode: 'online' }));
        dispatch('A3', data, data !== null);
      } else if (featureId === 'A4') {
        const data = await a4r.current.run(() => V2.geminiPayloadPreview({ agent_id: aid, action_type: a4action }));
        dispatch('A4', data, data !== null);
      } else if (featureId === 'A5') {
        const data = await a5r.current.run(() => V2.complianceStatus());
        dispatch('A5', data, data !== null);
      } else if (featureId === 'A6') {
        const data = await a6r.current.run(() => V2.scoreAction({ agent_id: aid, action_type: 'read', mode: 'offline' }));
        dispatch('A6', data, data !== null);
      } else if (featureId === 'A7') {
        const data = await a7r.current.run(() => V2.triggerHoneypotTest({ agent_id: aid }));
        dispatch('A7', data, data !== null);
      } else if (featureId === 'A8') {
        const data = await a8r.current.run(() => V2.honeypotAction({ agent_id: aid, action_type: 'read_sensitive_data' }));
        dispatch('A8', data, data !== null);
      } else if (featureId === 'A9') {
        const data = await a9r.current.run(() => V2.oraclePredict());
        dispatch('A9', data, data !== null);
      }
    };

    window.addEventListener('triggerFeature', handler);
    return () => window.removeEventListener('triggerFeature', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-full">
      {/* Teal aurora background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-950/50 via-transparent to-green-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,204,170,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,255,136,0.08)_0%,transparent_50%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 space-y-4">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SparklesText
            text="MANTIS — AI Anomaly Detection"
            colors={{ first: "#00ccaa", second: "#00ff88" }}
            className="text-xl font-bold"
            sparklesCount={6}
          />
          <p className="text-gray-500 text-sm mt-1">A1–A9 · Gemini behavioral ML + honeypot routing + Oracle Scroll</p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 xl:grid-cols-2 gap-4"
        >
          {/* A1 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="A1" title="50-Action Behavioral Baseline" accent={A}
              description="Build agent's behavioral profile from 50 representative actions"
              onRun={() => a1.run(() => V2.buildBaseline({ agent_id: agentId }))}
              running={a1.running} result={a1.result} error={a1.error} proofs={a1.proofs}>
              {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
            </FeatureCard>
          </motion.div>

          {/* A2 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="A2" title="Peer-Class Lattice Baseline" accent={A}
              description="Inherit baseline from same-sector agents — no cold-start"
              onRun={() => a2.run(() => V2.peerBaseline(agentId))}
              running={a2.running} result={a2.result} error={a2.error} proofs={a2.proofs}>
              {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
            </FeatureCard>
          </motion.div>

          {/* A3 — animated SVG arc gauge */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="A3" title="Real-Time Action Scoring (0–100)" accent={A}
              description="Score action against baseline via Gemini — live gauge updates every 3s"
              onRun={() => a3.run(() => V2.scoreAction({ agent_id: agentId, action_type: a3action, mode: "online" }))}
              running={a3.running} result={null} error={a3.error} proofs={a3.proofs}>
              <div className="space-y-3">
                {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
                <select value={a3action} onChange={e => setA3action(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white">
                  {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <AnimatePresence>
                  {a3.result && (() => {
                    const d = a3.result as { risk_score: number; status: string; explanation: string };
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-2"
                      >
                        <RiskGauge score={d.risk_score} />
                        <motion.p
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-xs font-bold"
                          style={{ color: d.status === "NORMAL" ? "#00ff88" : d.status === "HONEYPOT_ROUTE" ? "#ff3333" : "#ffaa00" }}
                        >
                          {d.status}
                        </motion.p>
                        {d.explanation && <p className="text-xs text-gray-400">{d.explanation}</p>}
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            </FeatureCard>
          </motion.div>

          {/* A4 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="A4" title="Guardrailed Gemini — Data Minimization" accent={A}
              description="Shows exactly what is vs is NOT sent to Gemini"
              onRun={() => a4.run(() => V2.geminiPayloadPreview({ agent_id: agentId, action_type: a4action }))}
              running={a4.running} result={null} error={a4.error} proofs={a4.proofs}>
              <div className="space-y-2">
                {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
                <select value={a4action} onChange={e => setA4action(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white">
                  {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <AnimatePresence>
                  {a4.result && (() => {
                    const d = a4.result as { raw_context_NEVER_sent_to_gemini: unknown; statistical_vectors_sent_to_gemini: unknown; proof: string };
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-2 gap-2 mt-2"
                      >
                        <div className="rounded border border-red/20 bg-red/5 p-2">
                          <p className="text-xs text-red font-bold mb-1">❌ NEVER sent to Gemini</p>
                          <pre className="text-xs text-gray-400 whitespace-pre-wrap">{JSON.stringify(d.raw_context_NEVER_sent_to_gemini, null, 2).slice(0, 200)}</pre>
                        </div>
                        <div className="rounded border border-green/20 bg-green/5 p-2">
                          <p className="text-xs text-green font-bold mb-1">✅ Sent to Gemini</p>
                          <pre className="text-xs text-gray-400 whitespace-pre-wrap">{JSON.stringify(d.statistical_vectors_sent_to_gemini, null, 2)}</pre>
                        </div>
                        <p className="col-span-2 text-xs text-gray-500">{d.proof}</p>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            </FeatureCard>
          </motion.div>

          {/* A5 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="A5" title="Gemini BAA / HIPAA / SOC2 Compliance" accent={A}
              description="Verify compliance configuration — BAA active, raw context never exits"
              onRun={() => a5.run(() => V2.complianceStatus())}
              running={a5.running} result={a5.result} error={a5.error} proofs={a5.proofs} />
          </motion.div>

          {/* A6 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="A6" title="On-Prem LLM Fallback (Ollama)" accent={A}
              description="Switch to offline mode → Llama3 via Ollama instead of Gemini"
              onRun={() => a6.run(() => V2.scoreAction({ agent_id: agentId, action_type: a3action, mode: offlineMode ? "offline" : "online" }))}
              running={a6.running} result={a6.result} error={a6.error} proofs={a6.proofs}>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <motion.button
                    onClick={() => setOfflineMode(v => !v)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${offlineMode ? "bg-teal" : "bg-white/20"}`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                      animate={{ left: offlineMode ? "auto" : "2px", right: offlineMode ? "2px" : "auto" }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                  <span className="text-sm text-white">{offlineMode ? "Offline Mode (Ollama/Llama3)" : "Gemini Mode"}</span>
                </label>
              </div>
            </FeatureCard>
          </motion.div>
        </motion.div>

        {/* A3 Live Risk Chart — AreaChart with gradient */}
        <AnimatePresence>
          {agentScores.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-xl border border-white/10 bg-[#161616] p-4"
            >
              <h3 className="text-white text-sm font-semibold mb-3">A3 — Live Risk Score History</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={agentScores.slice(-30)}>
                    <defs>
                      <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ccaa" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00ccaa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="timestamp" tick={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#666", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: "#111", border: "1px solid #333", color: "#fff", fontSize: 11 }}
                      formatter={(v: unknown) => [v as string, "Risk Score"]}
                      labelFormatter={(l: unknown) => new Date(String(l)).toLocaleTimeString("en-IN")}
                    />
                    <ReferenceLine y={90} stroke="#ff3333" strokeDasharray="3 3" />
                    <ReferenceLine y={70} stroke="#ffaa00" strokeDasharray="3 3" />
                    <Area
                      type="monotone"
                      dataKey="risk_score"
                      stroke="#00ccaa"
                      strokeWidth={2}
                      fill="url(#riskGradient)"
                      dot={false}
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* A7, A8, A9 grid */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 xl:grid-cols-2 gap-4"
        >
          {/* A7 — border flash 3x on result */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
            animate={a7Flash ? {
              boxShadow: [
                "0 0 0 0 transparent",
                "0 0 0 3px #ff3333, 0 0 20px rgba(255,50,50,0.6)",
                "0 0 0 0 transparent",
                "0 0 0 3px #ff3333, 0 0 20px rgba(255,50,50,0.6)",
                "0 0 0 0 transparent",
                "0 0 0 3px #ff3333, 0 0 20px rgba(255,50,50,0.6)",
                "0 0 0 0 transparent",
              ]
            } : {}}
            transition={{ duration: 1.5 }}
            className="rounded-xl"
          >
            <FeatureCard id="A7" title="Auto-Route to Honeypot (score > 90)" accent={A}
              description="Flood 10 anomalous actions → score spikes → agent silently routed to honeypot"
              onRun={() => a7.run(() => V2.triggerHoneypotTest({ agent_id: agentId }))}
              running={a7.running} result={a7.result} error={a7.error} proofs={a7.proofs}>
              {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
            </FeatureCard>
          </motion.div>

          {/* A8 — dual-panel slide from sides */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="A8" title="Honeypot Isolation Chamber" accent={A}
              description="Action from honeypot agent → fake success shown to attacker, real DB untouched"
              onRun={() => a8.run(() => V2.honeypotAction({ agent_id: agentId, action_type: "read_sensitive_data" }))}
              running={a8.running} result={null} error={a8.error} proofs={a8.proofs}>
              <p className="text-xs text-gray-500">Run A7 first to route agent to honeypot</p>
              <AnimatePresence>
                {a8.result && (() => {
                  const d = a8.result as { what_attacker_sees: unknown; what_actually_happened: unknown };
                  return (
                    <div className="grid grid-cols-2 gap-2 mt-2 overflow-hidden">
                      <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.4 }}
                        className="rounded border border-green/20 bg-green/5 p-2"
                      >
                        <p className="text-xs text-green font-bold mb-1">What attacker sees</p>
                        <pre className="text-xs text-gray-400 whitespace-pre-wrap">{JSON.stringify(d.what_attacker_sees, null, 2)}</pre>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        transition={{ duration: 0.4 }}
                        className="rounded border border-red/20 bg-red/5 p-2"
                      >
                        <p className="text-xs text-red font-bold mb-1">What actually happened</p>
                        <pre className="text-xs text-gray-400 whitespace-pre-wrap">{JSON.stringify(d.what_actually_happened, null, 2)}</pre>
                      </motion.div>
                    </div>
                  );
                })()}
              </AnimatePresence>
            </FeatureCard>
          </motion.div>

          {/* A9 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="A9" title="Oracle Scroll — Predictive CVE" accent={A}
              description="Gemini analyzes honeypot telemetry to predict next attack vector"
              onRun={() => a9.run(() => V2.oraclePredict())}
              running={a9.running} result={a9.result} error={a9.error} proofs={a9.proofs} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
