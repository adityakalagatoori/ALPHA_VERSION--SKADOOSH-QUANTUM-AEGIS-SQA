import { useState } from "react";
import { motion } from "framer-motion";
import { FeatureCard, useFeature } from "../components/FeatureCard";
import { useAgentStore } from "../store/agentStore";
import { V2 } from "../api/client";
import { SparklesText } from "../components/ui/sparkles-text";
import { BackgroundGradientAnimation } from "../components/ui/background-gradient-animation";

const A = "#4488ff";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export function Crane() {
  const { selectedAgentId } = useAgentStore();
  const agentId = selectedAgentId || "";

  // Scroll Action 1 — Issue Capability Token (C1+C3)
  const issue = useFeature();
  const [allowedActions, setAllowedActions] = useState<string[]>(["read", "write", "payments"]);
  const [expiry, setExpiry] = useState(300);

  // Scroll Action 2 — Test Scope Gate (C2+C4+C5)
  const scopeGate = useFeature();
  const [allowedAction, setAllowedAction] = useState("read");
  const [blockedAction, setBlockedAction] = useState("admin_delete");

  // Scroll Action 3 — Jade Palace Tribunal (C6+C7)
  const tribunal = useFeature();
  const [tribunalAction, setTribunalAction] = useState("admin_delete");

  const ALL_ACTIONS = ["read", "write", "payments", "delete", "transfer", "approve"];

  const toggleAction = (a: string) =>
    setAllowedActions(prev => (prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]));

  return (
    <div className="relative min-h-full">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <BackgroundGradientAnimation
          gradientBackgroundStart="rgb(10, 15, 26)"
          gradientBackgroundEnd="rgb(13, 31, 60)"
          firstColor="68, 136, 255"
          secondColor="0, 100, 200"
          thirdColor="10, 10, 26"
          fourthColor="26, 18, 8"
          fifthColor="0, 60, 120"
          interactive={false}
          containerClassName="h-full w-full"
        />
      </div>

      <div className="relative z-10 p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <SparklesText
            text="THE TRIBUNAL SCROLL"
            colors={{ first: "#4488ff", second: "#00ccff" }}
            className="text-2xl font-bold tracking-tight"
            sparklesCount={8}
          />
          <p className="text-gray-500 text-sm mt-1">
            CRANE · C1–C7 · JWT capability tokens, MultiSig proofs, ArmorIQ OPA policy enforcement
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {["C1 JWT Token", "C2 Scope Blocker", "C3 MultiSig", "C4 ArmorIQ Gate", "C5 Checkpoint", "C6 Expiry Halt", "C7 SHAP Tribunal"].map(f => (
              <span key={f} className="text-xs px-2 py-0.5 rounded border border-blue-700/40 text-blue-400 bg-blue-900/10 font-mono">{f}</span>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {/* ACTION 1 — ISSUE CAPABILITY TOKEN */}
          <motion.div variants={cardVariants} whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}>
            <FeatureCard
              id="CAPABILITY TOKEN"
              title="Issue Signed JWT + Dilithium MultiSig Proof"
              accent={A}
              description="Issue scope-locked Dilithium-signed JWT + generate 3-of-3 MultiSig capability proof"
              badge="C1 · C3 · Quantum-Signed"
              onRun={() =>
                issue.run(() =>
                  V2.tribunalIssueToken({
                    agent_id: agentId || "DEMO-AGENT",
                    allowed_actions: allowedActions,
                    expiry_seconds: expiry,
                  })
                )
              }
              running={issue.running}
              result={issue.result}
              error={issue.error}
              proofs={issue.proofs}
            >
              <div className="space-y-3">
                {!agentId && <p className="text-amber-500 text-xs">Select an agent from the top bar</p>}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Allowed actions (scope):</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_ACTIONS.map(a => (
                      <label key={a} className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allowedActions.includes(a)}
                          onChange={() => toggleAction(a)}
                          className="accent-blue-400 w-3.5 h-3.5"
                        />
                        <span className="text-xs text-gray-300 font-mono">{a}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Token expiry:</span>
                  <select
                    value={expiry}
                    onChange={e => setExpiry(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value={300}>5 minutes</option>
                    <option value={3600}>1 hour</option>
                    <option value={86400}>24 hours</option>
                  </select>
                </div>
              </div>
            </FeatureCard>
          </motion.div>

          {/* ACTION 2 — TEST SCOPE GATE */}
          <motion.div variants={cardVariants} whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}>
            <FeatureCard
              id="SCOPE GATE"
              title="Out-of-Scope Blocker + ArmorIQ OPA Gate + Checkpoint"
              accent={A}
              description="Test allowed action (pass) vs blocked action (fail). ArmorIQ OPA as second gate. Mid-execution checkpoint re-verification."
              badge="C2 · C4 · C5 · Dual-Gate"
              onRun={() =>
                scopeGate.run(() =>
                  V2.tribunalScopeGate({
                    agent_id: agentId || "DEMO-AGENT",
                    allowed_action: allowedAction,
                    blocked_action: blockedAction,
                  })
                )
              }
              running={scopeGate.running}
              result={scopeGate.result}
              error={scopeGate.error}
              proofs={scopeGate.proofs}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-green mb-1">Allowed action:</p>
                  <select
                    value={allowedAction}
                    onChange={e => setAllowedAction(e.target.value)}
                    className="w-full bg-white/5 border border-green/20 rounded px-2 py-1.5 text-xs text-white"
                  >
                    {ALL_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-red-400 mb-1">Blocked action:</p>
                  <input
                    value={blockedAction}
                    onChange={e => setBlockedAction(e.target.value)}
                    placeholder="admin_delete"
                    className="w-full bg-white/5 border border-red-900/30 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600"
                  />
                </div>
              </div>
              <p className="text-gray-600 text-xs mt-2">Both results + POLICY chip (live OPA decision) shown in response</p>
            </FeatureCard>
          </motion.div>

          {/* ACTION 3 — JADE PALACE TRIBUNAL */}
          <motion.div variants={cardVariants} whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}>
            <FeatureCard
              id="JADE PALACE"
              title="Token Expiry Halt + SHAP Tribunal Explainer"
              accent={A}
              description="Issue 1-second token to simulate mid-task expiry halt. SHAP feature scores explain the tribunal ruling with 97% confidence."
              badge="C6 · C7 · Explainable AI"
              onRun={() =>
                tribunal.run(() =>
                  V2.tribunalJadePalace({
                    agent_id: agentId || "DEMO-AGENT",
                    action: tribunalAction,
                  })
                )
              }
              running={tribunal.running}
              result={tribunal.result}
              error={tribunal.error}
              proofs={tribunal.proofs}
            >
              <div className="space-y-2">
                {!agentId && <p className="text-amber-500 text-xs">Select an agent from the top bar</p>}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Action to tribunal:</p>
                  <input
                    value={tribunalAction}
                    onChange={e => setTribunalAction(e.target.value)}
                    placeholder="admin_delete"
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                  />
                </div>
                <p className="text-gray-600 text-xs">1-second token expires before task completes. SHAP scores in response show WHY the Tribunal ruled.</p>
              </div>
            </FeatureCard>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
