import { useState } from "react";
import { motion } from "framer-motion";
import { FeatureCard, useFeature } from "../components/FeatureCard";
import { useAgentStore } from "../store/agentStore";
import { V2 } from "../api/client";
import { usePolling } from "../hooks/usePolling";
import { SparklesText } from "../components/ui/sparkles-text";
import ShaderBackground from "../components/ui/shader-background";
import clsx from "clsx";

const A = "#e8e8e8";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export function Po() {
  const { selectedAgentId } = useAgentStore();
  const agentId = selectedAgentId || "";

  // Scroll Action 1 — Dragon Warrior Pipeline (P1+P2+P3+P6+P8+P9+P11)
  const pipeline = useFeature();
  const [poMsg, setPoMsg] = useState("Process transaction for customer #4821");
  const [simulateAttack, setSimulateAttack] = useState(false);

  // Scroll Action 2 — BFT Consensus Demo (P5)
  const bft = useFeature();
  const [bftPayload, setBftPayload] = useState("Authorize fund transfer $5M — cross-border");

  // Scroll Action 3 — Financial Multi-Sign Demo (P7+P10)
  const finSign = useFeature();
  const [finAmount, setFinAmount] = useState("$10,000,000");
  const [finDesc, setFinDesc] = useState("Quarterly dividend payment");

  // Live trust scores (P6 live feed)
  const { data: trustData } = usePolling<{
    agents: { agent_id: string; name: string; trust_score: number; sector: string; trust_color: string; blacklisted: boolean }[];
  }>(
    () => V2.trustScores() as Promise<{ data: unknown | null; error: string | null }>,
    4000
  );

  const trustAgents = trustData?.agents?.slice(0, 8) || [];

  return (
    <div className="relative min-h-full bg-[#080808]">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <ShaderBackground />
      </div>

      <div className="relative z-10 p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <SparklesText
            text="THE DRAGON SCROLL"
            colors={{ first: "#ffffff", second: "#aaaaaa" }}
            className="text-2xl font-bold tracking-tight"
            sparklesCount={8}
          />
          <p className="text-gray-500 text-sm mt-1">
            PO · P1–P11 · Central message gateway, BFT consensus, Kyber encryption, financial multi-approval
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {["P1 Gateway", "P2 Pipeline", "P3 Verdict", "P4 Kyber-1024", "P5 BFT 3-of-5", "P6 Trust Net", "P7 Fin Sign", "P8 Command", "P9 Sector Filter", "P10 Tamper Logs", "P11 Risk Score"].map(
              f => (
                <span
                  key={f}
                  className="text-xs px-2 py-0.5 rounded border border-gray-700/50 text-gray-400 bg-white/5 font-mono"
                >
                  {f}
                </span>
              )
            )}
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {/* ACTION 1 — DRAGON WARRIOR PIPELINE */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard
              id="DRAGON WARRIOR"
              title="Central Gateway Pipeline — Deliver or Kill"
              accent={A}
              description="Route message through all 5 warrior checks: TIGRESS scan → MONKEY verify → CRANE scope → SNAKE audit → MANTIS score. Final verdict: DELIVER or KILL."
              badge="P1 · P2 · P3 · P6 · P8 · P9 · P11"
              onRun={() =>
                pipeline.run(() =>
                  V2.poGateway({
                    agent_id: agentId || "DEMO-AGENT",
                    message: poMsg,
                    simulate_attack: simulateAttack,
                  })
                )
              }
              running={pipeline.running}
              result={pipeline.result}
              error={pipeline.error}
              proofs={pipeline.proofs}
            >
              <div className="space-y-2">
                <textarea
                  value={poMsg}
                  onChange={e => setPoMsg(e.target.value)}
                  rows={2}
                  placeholder="Message to send through the gateway"
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none resize-none"
                />
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={simulateAttack}
                    onChange={e => setSimulateAttack(e.target.checked)}
                    className="accent-red-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-400">
                    Simulate attack{" "}
                    {simulateAttack && <span className="text-red-400 font-mono text-xs">(expect KILL verdict)</span>}
                  </span>
                </label>
                <p className="text-gray-600 text-xs">
                  Returns full pipeline trace, live trust scores, risk score 0–100, and DELIVER/KILL verdict with ARMORIQ chip.
                </p>
              </div>
            </FeatureCard>
          </motion.div>

          {/* ACTION 2 — BFT CONSENSUS DEMO */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard
              id="BFT CONSENSUS"
              title="3-of-5 Dilithium BFT Threshold Signing"
              accent={A}
              description="Generate 5 fresh Dilithium-3 keypairs as warrior nodes. Each independently signs the payload. Returns proof_id and all 5 quantum signatures."
              badge="P5 · Byzantine Fault Tolerant"
              onRun={() =>
                bft.run(() =>
                  V2.dragonBftConsensus({
                    agent_id: agentId || "DEMO-AGENT",
                    payload: bftPayload,
                  })
                )
              }
              running={bft.running}
              result={bft.result}
              error={bft.error}
              proofs={bft.proofs}
            >
              <div className="space-y-2">
                <input
                  value={bftPayload}
                  onChange={e => setBftPayload(e.target.value)}
                  placeholder="High-value payload to sign"
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                />
                <p className="text-gray-600 text-xs">
                  5 Dilithium-3 keypairs generated live. Each signs the payload with a unique proof_id. SUPABASE chip shows write to{" "}
                  <code className="text-gray-400/70">agent_actions</code> table.
                </p>
              </div>
            </FeatureCard>
          </motion.div>

          {/* ACTION 3 — FINANCIAL MULTI-SIGN */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard
              id="FINANCIAL SIGN"
              title="Multi-Approver Financial Signing + Tamper-Proof Log"
              accent={A}
              description="CFO_NODE + COMPLIANCE_NODE + RISK_NODE each sign the transaction with a fresh Dilithium-3 key. SHA-3-256 tamper-proof log written to audit_logs."
              badge="P7 · P10 · Financial Multi-Approval"
              onRun={() =>
                finSign.run(() =>
                  V2.dragonFinancialMultisign({
                    agent_id: agentId || "DEMO-AGENT",
                    amount: finAmount,
                    description: finDesc,
                  })
                )
              }
              running={finSign.running}
              result={finSign.result}
              error={finSign.error}
              proofs={finSign.proofs}
            >
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={finAmount}
                    onChange={e => setFinAmount(e.target.value)}
                    placeholder="Amount"
                    className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                  />
                  <input
                    value={finDesc}
                    onChange={e => setFinDesc(e.target.value)}
                    placeholder="Description"
                    className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                  />
                </div>
                <p className="text-gray-600 text-xs">
                  3 approver nodes, 3 fresh Dilithium-3 keypairs. SHA-3-256 hash chain log in{" "}
                  <code className="text-gray-400/70">audit_logs</code>. SUPABASE + ARMORIQ chips in response.
                </p>
              </div>
            </FeatureCard>
          </motion.div>
        </motion.div>

        {/* Live Trust Score Network — P6 */}
        {trustAgents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-xl border border-white/10 bg-[#0e0e0e] p-4"
          >
            <p className="text-xs font-mono text-gray-500 mb-3 uppercase tracking-wider">
              Live Trust Score Network — P6 (auto-refresh 4s)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {trustAgents.map(agent => (
                <div
                  key={agent.agent_id}
                  className={clsx(
                    "rounded-lg p-2.5 border",
                    agent.blacklisted
                      ? "border-red-900/40 bg-red-900/5"
                      : agent.trust_score >= 80
                      ? "border-green/20 bg-green/5"
                      : agent.trust_score >= 50
                      ? "border-yellow-700/30 bg-yellow-900/5"
                      : "border-red-900/30 bg-red-900/5"
                  )}
                >
                  <p className="text-white text-xs font-medium truncate">{agent.name}</p>
                  <p className="text-gray-500 text-xs">{agent.sector}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex-1 bg-white/5 rounded-full h-1.5">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          width: `${agent.trust_score}%`,
                          background: agent.blacklisted
                            ? "#ff3333"
                            : agent.trust_score >= 80
                            ? "#00ff88"
                            : agent.trust_score >= 50
                            ? "#ffd700"
                            : "#ff6600",
                        }}
                        animate={{ width: `${agent.trust_score}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span
                      className="text-xs font-mono font-bold"
                      style={{
                        color: agent.blacklisted ? "#ff3333" : agent.trust_score >= 80 ? "#00ff88" : "#ffd700",
                      }}
                    >
                      {agent.trust_score}
                    </span>
                  </div>
                  {agent.blacklisted && (
                    <p className="text-red-500 text-xs mt-0.5 font-mono">BLACKLISTED</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
