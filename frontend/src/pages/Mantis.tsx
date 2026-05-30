import { motion } from "framer-motion";
import { FeatureCard, useFeature } from "../components/FeatureCard";
import { useAgentStore } from "../store/agentStore";
import { V2 } from "../api/client";
import { SparklesText } from "../components/ui/sparkles-text";

const A = "#ff44aa";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export function Mantis() {
  const { selectedAgentId } = useAgentStore();
  const agentId = selectedAgentId || "";

  const buildBaseline = useFeature();
  const simulateAttack = useFeature();
  const invokeOracle = useFeature();

  const body = { agent_id: agentId || "DEMO-AGENT" };

  return (
    <div className="relative min-h-full bg-[#0d0510]">
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(255,68,170,0.05) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(180,0,120,0.04) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <SparklesText
            text="THE ORACLE SCROLL"
            colors={{ first: "#ff44aa", second: "#cc0077" }}
            className="text-2xl font-bold tracking-tight"
            sparklesCount={8}
          />
          <p className="text-gray-500 text-sm mt-1">
            MANTIS · A1–A9 · Behavioral AI baseline, Gemini guardrail, honeypot isolation, predictive CVE oracle
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {["A1 Baseline 50", "A2 Peer Lattice", "A3 Risk Scoring", "A4 Gemini Guard", "A5 BAA Signed", "A6 On-Prem LLM", "A7 Auto-Honeypot", "A8 Isolation", "A9 CVE Oracle"].map(
              f => (
                <span
                  key={f}
                  className="text-xs px-2 py-0.5 rounded border border-pink-800/40 text-pink-400 bg-pink-900/10 font-mono"
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
          {/* ACTION 1 — BUILD BASELINE */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard
              id="BUILD BASELINE"
              title="Behavioral Baseline + Peer Lattice + Risk Scoring"
              accent={A}
              description="Log 5 normal actions to build behavioral baseline. Calculate peer-class lattice from same sector. Score each action 0–100."
              badge="A1 · A2 · A3 · Behavioral AI"
              onRun={() => buildBaseline.run(() => V2.oracleBuildBaseline(body))}
              running={buildBaseline.running}
              result={buildBaseline.result}
              error={buildBaseline.error}
              proofs={buildBaseline.proofs}
            >
              <p className="text-gray-600 text-xs">
                Writes to <code className="text-pink-400/60">agent_actions</code>. Returns peer class count, baseline
                progress, and live risk scores per action.
              </p>
            </FeatureCard>
          </motion.div>

          {/* ACTION 2 — SIMULATE ATTACK */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard
              id="SIMULATE ATTACK"
              title="Gemini Guardrail + Honeypot Auto-Routing"
              accent={A}
              description="Log high-risk action (score ≥ 93). Guardrailed Gemini analyzes (HIPAA/SOC2 BAA, on-prem fallback). Auto-route to honeypot isolation chamber."
              badge="A3 · A4 · A5 · A6 · A7 · A8"
              onRun={() => simulateAttack.run(() => V2.oracleSimulateAttack(body))}
              running={simulateAttack.running}
              result={simulateAttack.result}
              error={simulateAttack.error}
              proofs={simulateAttack.proofs}
            >
              <div className="space-y-1">
                <p className="text-gray-600 text-xs">
                  Gemini statistical analysis — raw context never exits gateway. Falls back to on-prem LLM if needed.
                  Agent flagged <code className="text-red-400/60">honeypot_isolated=True</code> in Supabase.
                </p>
                <p className="text-amber-600/70 text-xs">Run Build Baseline first for baseline comparison</p>
              </div>
            </FeatureCard>
          </motion.div>

          {/* ACTION 3 — INVOKE ORACLE */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard
              id="INVOKE ORACLE"
              title="Oracle Scroll — Predictive CVE Model"
              accent={A}
              description="Pull honeypot events + high-risk actions. Generate 3 predictive CVE threat forecasts. Write to oracle_predictions table."
              badge="A9 · Predictive AI"
              onRun={() => invokeOracle.run(() => V2.oracleInvokeOracle(body))}
              running={invokeOracle.running}
              result={invokeOracle.result}
              error={invokeOracle.error}
              proofs={invokeOracle.proofs}
            >
              <p className="text-gray-600 text-xs">
                Reads <code className="text-pink-400/60">honeypot_logs</code> +{" "}
                <code className="text-pink-400/60">agent_actions</code>. Writes 3 predictions to{" "}
                <code className="text-pink-400/60">oracle_predictions</code>. Returns confidence scores per CVE vector.
              </p>
            </FeatureCard>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
