import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeatureCard, useFeature } from "../components/FeatureCard";
import { useAgentStore } from "../store/agentStore";
import { V2 } from "../api/client";
import { usePolling } from "../hooks/usePolling";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { SparklesText } from "../components/ui/sparkles-text";
import { SparklesCore } from "../components/ui/sparkles";
import ShaderBackground from "../components/ui/shader-background";
import { RippleButton } from "../components/ui/multi-type-ripple-buttons";
import clsx from "clsx";

const A = "#ffffff";

const SECTORS = ["all", "banking", "healthcare", "legal", "government", "enterprise"];

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const pipelineVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const pipelineStepVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export function Po() {
  const { selectedAgentId } = useAgentStore();
  const agentId = selectedAgentId || "";

  // P1/P2/P3
  const p1 = useFeature();
  const [poMsg, setPoMsg] = useState("Process transaction for customer #4821");
  const [simulateAttack, setSimulateAttack] = useState(false);

  // P4
  const p4 = useFeature();
  const [p4msg, setP4msg] = useState("Hello from SQA — Kyber-1024 test");
  const [typedCipher, setTypedCipher] = useState("");
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (p4.result) {
      const d = p4.result as { encrypted_preview?: string };
      const str = d.encrypted_preview || "";
      setTypedCipher("");
      let idx = 0;
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      typewriterRef.current = setInterval(() => {
        setTypedCipher(str.slice(0, idx + 1));
        idx++;
        if (idx >= str.length && typewriterRef.current) clearInterval(typewriterRef.current);
      }, 18);
    }
    return () => { if (typewriterRef.current) clearInterval(typewriterRef.current); };
  }, [p4.result]);

  // P5 — BFT
  const p5init = useFeature();
  const p5sign = useFeature();
  const [bftProofId, setBftProofId] = useState<string | null>(null);
  const [bftSigs, setBftSigs] = useState(0);

  // P6 — Trust scores (live)
  const { data: trustData } = usePolling<{ agents: { agent_id: string; name: string; trust_score: number; sector: string; trust_color: string; blacklisted: boolean }[] }>(
    () => V2.trustScores() as Promise<{ data: unknown | null; error: string | null }>, 3000);

  // P7 — Finance
  const p7init = useFeature();
  const p7sign = useFeature();
  const [finProofId, setFinProofId] = useState<string | null>(null);
  const [_finSigs, setFinSigs] = useState(0);
  const [amount, setAmount] = useState("$10,000,000");
  const [finDesc, setFinDesc] = useState("Quarterly dividend payment");

  // P8/P9 — Command dashboard
  const [sector, setSector] = useState("all");
  const { data: dashboard } = usePolling<{ agents: unknown[]; audit_feed: unknown[]; active_alerts: unknown[]; merkle_root: unknown; keypair_pool_remaining: number }>(
    () => V2.commandDashboard(sector) as Promise<{ data: unknown | null; error: string | null }>, 5000);

  // Refs for voice event handler
  const p1r = useRef(p1); p1r.current = p1;
  const p4r = useRef(p4); p4r.current = p4;
  const p5initr = useRef(p5init); p5initr.current = p5init;
  const p7initr = useRef(p7init); p7initr.current = p7init;
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

      if (featureId === 'P1' || featureId === 'P2' || featureId === 'P3') {
        const msg = inputs?.message || 'Dragon Warrior voice test';
        setPoMsg(msg);
        const data = await p1r.current.run(() =>
          V2.poGateway({ agent_id: aid, message: msg, simulate_attack: false })
        );
        dispatch(featureId, data, data !== null);
      } else if (featureId === 'P4') {
        const msg = inputs?.message || 'Dragon Warrior encrypted voice test';
        setP4msg(msg);
        const data = await p4r.current.run(() => V2.encryptedSend({ agent_id: aid, message: msg }));
        dispatch('P4', data, data !== null);
      } else if (featureId === 'P5') {
        const data = await p5initr.current.run(async () => {
          const r = await V2.newThresholdProof({ action: 'Dragon Warrior BFT test' });
          if (!r.error && r.data) { setBftProofId((r.data as { proof_id: string }).proof_id); setBftSigs(0); }
          return r;
        });
        dispatch('P5', data, data !== null);
      } else if (featureId === 'P6') {
        dispatch('P6', { status: 'Live trust scores displayed' }, true);
      } else if (featureId === 'P7') {
        const data = await p7initr.current.run(async () => {
          const r = await V2.newFinanceProof({ agent_id: aid, amount: '$1,000,000', description: 'Dragon Warrior voice test' });
          if (!r.error && r.data) { setFinProofId((r.data as { proof_id: string }).proof_id); setFinSigs(0); }
          return r;
        });
        dispatch('P7', data, data !== null);
      } else if (featureId === 'P8' || featureId === 'P9' || featureId === 'P10' || featureId === 'P11') {
        dispatch(featureId, { status: 'Live panel active' }, true);
      }
    };

    window.addEventListener('triggerFeature', handler);
    return () => window.removeEventListener('triggerFeature', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // P11 — Risk chart
  const { data: riskHistory } = usePolling<{ history: { t: string; score: number; action: string }[] }>(
    () => agentId ? V2.riskHistory(agentId) as Promise<{ data: unknown | null; error: string | null }> : Promise.resolve({ data: null, error: null }),
    3000, !!agentId);

  return (
    <div className="relative min-h-full">
      {/* Shader background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <ShaderBackground className="absolute inset-0 w-full h-full opacity-35" />
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
            text="PO — Dragon Warrior Gateway"
            colors={{ first: "#ffffff", second: "#c9a227" }}
            className="text-xl font-bold"
            sparklesCount={6}
          />
          <p className="text-gray-500 text-sm mt-1">P1–P11 · Central message gateway + pipeline orchestration + BFT + financial signing</p>
        </motion.div>

        {/* P1/P2/P3 — pipeline with sequential slide */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <FeatureCard id="P1/P2/P3" title="Dragon Warrior Gateway + Full Pipeline + Verdict" accent={A}
            description="All 5 warrior checks sequenced → DELIVER or KILL verdict"
            onRun={() => p1.run(() => V2.poGateway({ agent_id: agentId, message: poMsg, simulate_attack: simulateAttack }))}
            running={p1.running} result={null} error={p1.error} proofs={p1.proofs}>
            <div className="space-y-2">
              {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
              <input value={poMsg} onChange={e => setPoMsg(e.target.value)}
                placeholder="Message to gateway" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={simulateAttack} onChange={e => setSimulateAttack(e.target.checked)} />
                <span className="text-sm text-gray-400">Simulate attack (force KILL verdict)</span>
              </label>
            </div>
            <AnimatePresence>
              {p1.result && (() => {
                const d = p1.result as { pipeline: { step: string; emoji: string; status: string; elapsed_ms: number; detail: string }[]; verdict: string; verdict_message: string; total_ms: number; request_id: string };
                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 space-y-2"
                  >
                    <p className="text-xs text-gray-500 font-mono">Request: {d.request_id} · {d.total_ms}ms total</p>
                    <motion.div
                      variants={pipelineVariants}
                      initial="hidden"
                      animate="show"
                      className="space-y-1"
                    >
                      {d.pipeline.map((s, i) => (
                        <motion.div
                          key={i}
                          variants={pipelineStepVariants}
                          className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.02]"
                        >
                          <span className="text-base">{s.emoji}</span>
                          <span className="text-xs text-gray-300 flex-1">{s.step}</span>
                          <span className="text-xs font-mono text-gray-500">{s.elapsed_ms}ms</span>
                          <span className={clsx("text-xs font-bold", s.status === "PASS" ? "text-green" : "text-red")}>{s.status}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: d.pipeline.length * 0.08 + 0.1 }}
                      className={clsx("px-3 py-2 rounded border text-sm font-bold font-mono",
                        d.verdict === "DELIVER" ? "border-green/40 bg-green/5 text-green" : "border-red/40 bg-red/5 text-red")}
                    >
                      {d.verdict_message}
                    </motion.div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </FeatureCard>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 xl:grid-cols-2 gap-4"
        >
          {/* P4 — typewriter ciphertext */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="P4" title="Kyber-1024 Encrypted Channel" accent={A}
              description="Encrypt message with Kyber-1024 → show ciphertext → decrypt → verify match"
              onRun={() => p4.run(() => V2.encryptedSend({ agent_id: agentId, message: p4msg }))}
              running={p4.running} result={null} error={p4.error} proofs={p4.proofs}>
              <input value={p4msg} onChange={e => setP4msg(e.target.value)}
                placeholder="Message to encrypt" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600" />
              <AnimatePresence>
                {p4.result && (() => {
                  const d = p4.result as { original: string; encrypted_preview: string; decrypted: string; match: boolean };
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 space-y-1.5 text-xs font-mono"
                    >
                      <p><span className="text-gray-500">Original: </span><span className="text-white">{d.original}</span></p>
                      <p>
                        <span className="text-gray-500">Encrypted: </span>
                        <span className="text-amber/70 break-all">{typedCipher}<span className="animate-pulse">|</span></span>
                      </p>
                      <p>
                        <span className="text-gray-500">Decrypted: </span>
                        <span className="text-white">{d.decrypted}</span>
                        <span className="ml-2 text-green">{d.match ? "✅ MATCH" : "❌ MISMATCH"}</span>
                      </p>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </FeatureCard>
          </motion.div>

          {/* P5 — BFT with SparklesCore burst at 3/5 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="P5" title="3-of-5 Dilithium BFT Threshold Signing" accent={A}
              description="5 validators, 3 Dilithium signatures needed — BFT-tolerant">
              <div className="space-y-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <RippleButton
                    variant="default"
                    onClick={() => p5init.run(async () => {
                      const r = await V2.newThresholdProof({ action: "High-value system action" });
                      if (!r.error && r.data) { setBftProofId((r.data as { proof_id: string }).proof_id); setBftSigs(0); }
                      return r;
                    })}
                    disabled={p5init.running}
                    className="w-full py-2 rounded text-xs font-mono"
                    style={{ color: A, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)" }}
                  >
                    {p5init.running ? "Creating..." : "[ NEW PROOF ]"}
                  </RippleButton>
                </motion.div>
                {bftProofId && (
                  <div className="relative">
                    <p className="text-xs text-gray-500">Proof: {bftProofId.slice(0, 12)}... · {bftSigs}/5 signed</p>
                    {/* Signature progress bar */}
                    <div className="flex gap-1 my-2">
                      {[0, 1, 2, 3, 4].map(i => (
                        <motion.div
                          key={i}
                          className="h-1.5 flex-1 rounded-full"
                          animate={{ background: i < bftSigs ? (i < 3 ? "#ffffff" : "#00ff88") : "rgba(255,255,255,0.08)" }}
                          transition={{ duration: 0.3 }}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[0, 1, 2, 3, 4].map(i => (
                        <motion.div key={i} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                          <RippleButton
                            variant="default"
                            onClick={() => p5sign.run(async () => {
                              const r = await V2.thresholdSign(bftProofId, i);
                              if (!r.error && r.data) setBftSigs((r.data as { sigs_collected: number }).sigs_collected);
                              return r;
                            })}
                            disabled={p5sign.running}
                            className="w-full py-1.5 rounded text-xs font-mono"
                            style={{ color: A, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)" }}
                          >
                            V{i + 1}
                          </RippleButton>
                        </motion.div>
                      ))}
                    </div>
                    {/* SparklesCore burst at 3/5 threshold */}
                    <AnimatePresence>
                      {bftSigs >= 3 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
                        >
                          <SparklesCore
                            background="transparent"
                            particleColor="#00ff88"
                            particleDensity={120}
                            minSize={0.8}
                            maxSize={2}
                            speed={0.6}
                            className="w-full h-full"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {p5sign.result && (() => {
                      const d = p5sign.result as { threshold_met: boolean; status: string };
                      return (
                        <motion.p
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={clsx("text-xs font-bold mt-1", d.threshold_met ? "text-green" : "text-amber")}
                        >
                          {d.status}
                        </motion.p>
                      );
                    })()}
                  </div>
                )}
              </div>
            </FeatureCard>
          </motion.div>

          {/* P7 — Finance */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="P7" title="Dilithium Financial Signing (CFO/CTO/CISO)" accent={A}
              description="Multi-approver financial transaction — 3-of-3 required">
              <div className="space-y-2">
                {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
                <input value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="Amount" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600" />
                <input value={finDesc} onChange={e => setFinDesc(e.target.value)}
                  placeholder="Transaction description" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600" />
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <RippleButton
                    variant="default"
                    onClick={() => p7init.run(async () => {
                      const r = await V2.newFinanceProof({ agent_id: agentId, amount, description: finDesc });
                      if (!r.error && r.data) { setFinProofId((r.data as { proof_id: string }).proof_id); setFinSigs(0); }
                      return r;
                    })}
                    disabled={p7init.running}
                    className="w-full py-1.5 rounded text-xs font-mono"
                    style={{ color: A, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)" }}
                  >
                    {p7init.running ? "Creating..." : "[ INITIATE TRANSACTION ]"}
                  </RippleButton>
                </motion.div>
                {finProofId && (
                  <div className="flex gap-2">
                    {["CFO", "CTO", "CISO"].map((signer, i) => (
                      <motion.div key={signer} className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <RippleButton
                          variant="default"
                          onClick={() => p7sign.run(async () => {
                            const r = await V2.financeSign(finProofId, i);
                            if (!r.error && r.data) setFinSigs((r.data as { sigs: number }).sigs);
                            return r;
                          })}
                          disabled={p7sign.running}
                          className="w-full py-1.5 rounded text-xs font-mono"
                          style={{ color: A, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)" }}
                        >
                          {signer}
                        </RippleButton>
                      </motion.div>
                    ))}
                  </div>
                )}
                {p7sign.result && (() => {
                  const d = p7sign.result as { threshold_met: boolean; status: string };
                  return (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={clsx("text-xs font-bold", d.threshold_met ? "text-green" : "text-amber")}
                    >
                      {d.status}
                    </motion.p>
                  );
                })()}
              </div>
            </FeatureCard>
          </motion.div>

          {/* P6 — Live Trust Scores with pulsing dots */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="P6" title="Trust Score Network (live, 3s)" accent={A}
              description="Live trust score per agent — updates after every action">
              <div className="space-y-2 max-h-48 overflow-auto">
                {!trustData?.agents?.length ? (
                  <p className="text-gray-600 text-xs">No agents yet</p>
                ) : trustData.agents.map((a) => (
                  <motion.div
                    key={a.agent_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className={clsx("w-2 h-2 rounded-full flex-shrink-0",
                        a.trust_color === "green" ? "bg-green" : a.trust_color === "yellow" ? "bg-amber" : "bg-red")}
                    />
                    <span className="text-white text-xs flex-1 truncate">{a.name}</span>
                    <span className="text-xs text-gray-500">{a.sector}</span>
                    <motion.span
                      key={a.trust_score}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-xs font-mono w-8 text-right"
                      style={{ color: a.trust_color === "green" ? "#00ff88" : a.trust_color === "yellow" ? "#ffaa00" : "#ff3333" }}
                    >
                      {a.trust_score}
                    </motion.span>
                  </motion.div>
                ))}
              </div>
            </FeatureCard>
          </motion.div>
        </motion.div>

        {/* P8/P9 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-xl border border-white/10 bg-[#161616]/80 backdrop-blur-sm p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-semibold">P8/P9 — Live Security Command Dashboard</h3>
            <select value={sector} onChange={e => setSector(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white">
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {dashboard && (
            <motion.div
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs"
            >
              {[
                { label: "Agents", value: (dashboard.agents || []).length, color: "text-white" },
                { label: "Alerts", value: (dashboard.active_alerts || []).length, color: "text-red" },
                { label: "Keypair Pool", value: dashboard.keypair_pool_remaining, color: "text-amber" },
                { label: "Audit Feed", value: (dashboard.audit_feed || []).length, color: "text-blue" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                  whileHover={{ scale: 1.04 }}
                  className="rounded bg-white/5 p-2"
                >
                  <p className="text-gray-500">{stat.label}</p>
                  <motion.p
                    key={stat.value}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`font-bold text-lg ${stat.color}`}
                  >
                    {stat.value}
                  </motion.p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* P11 — AreaChart risk scoring */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-xl border border-white/10 bg-[#161616]/80 backdrop-blur-sm p-4"
        >
          <h3 className="text-white text-sm font-semibold mb-3">P11 — Live Risk Scoring Chart</h3>
          {!riskHistory?.history?.length ? (
            <p className="text-gray-600 text-xs">No risk history yet for this agent</p>
          ) : (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={riskHistory.history}>
                  <defs>
                    <linearGradient id="poRiskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#666", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid #333", color: "#fff", fontSize: 11 }}
                    formatter={(v: unknown) => [v as string, "Risk Score"]}
                    labelFormatter={(l: unknown) => new Date(String(l)).toLocaleTimeString("en-IN")}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fill="url(#poRiskGradient)"
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
