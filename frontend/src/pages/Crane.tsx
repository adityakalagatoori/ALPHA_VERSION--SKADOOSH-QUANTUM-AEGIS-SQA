import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeatureCard, useFeature } from "../components/FeatureCard";
import { useAgentStore } from "../store/agentStore";
import { V2 } from "../api/client";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { SparklesText } from "../components/ui/sparkles-text";
import { SparklesCore } from "../components/ui/sparkles";
import { BackgroundGradientAnimation } from "../components/ui/background-gradient-animation";
import { RippleButton } from "../components/ui/multi-type-ripple-buttons";

const A = "#4488ff";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stepVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const stepItemVariants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export function Crane() {
  const { selectedAgentId } = useAgentStore();
  const agentId = selectedAgentId || "";

  // C1 — Issue token
  const c1 = useFeature();
  const [actions, setActions] = useState<string[]>(["read", "write"]);
  const [expiry, setExpiry] = useState(300);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);

  // C2 — Check scope
  const c2 = useFeature();
  const [attemptAction, setAttemptAction] = useState("delete");

  // C3 — Multi-sig
  const c3 = useFeature();
  const [c3action, setC3action] = useState("Transfer $10M to account X");
  const [proofId, setProofId] = useState<string | null>(null);
  const c3sign = useFeature();
  const [signCount, setSignCount] = useState(0);

  // C4 — ArmorIQ gate
  const c4 = useFeature();
  const [c4action, setC4action] = useState("write");

  // C5 — Multi-step
  const c5 = useFeature();
  const [failAt, setFailAt] = useState(3);

  // C6 — Token expiry
  const c6 = useFeature();
  const [c6short, setC6short] = useState<string | null>(null);
  const [c6issued, setC6issued] = useState(false);

  // C7 — SHAP
  const c7 = useFeature();
  const [c7action, setC7action] = useState("delete");

  const toggleAction = (a: string) => setActions(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const ALL_ACTIONS = ["read", "write", "delete", "transfer", "approve"];

  const handleSign = async (i: number) => {
    if (!proofId) return;
    const result = await c3sign.run(() => V2.signProof(proofId, { approver_name: `Approver ${i + 1}` }));
    if (result !== null) setSignCount(prev => Math.min(3, prev + 1));
  };

  // Refs for voice event handler
  const c1r = useRef(c1); c1r.current = c1;
  const c2r = useRef(c2); c2r.current = c2;
  const c3r = useRef(c3); c3r.current = c3;
  const c4r = useRef(c4); c4r.current = c4;
  const c5r = useRef(c5); c5r.current = c5;
  const c6r = useRef(c6); c6r.current = c6;
  const c7r = useRef(c7); c7r.current = c7;
  const agentIdRef = useRef(agentId); agentIdRef.current = agentId;
  const issuedTokenRef = useRef(issuedToken); issuedTokenRef.current = issuedToken;

  useEffect(() => {
    const dispatch = (featureId: string, data: unknown, success: boolean) => {
      window.dispatchEvent(new CustomEvent('featureResult', {
        detail: { featureId, success, summary: success ? 'Complete.' : 'Failed.', data },
      }));
    };

    const handler = async (e: Event) => {
      const { featureId, inputs } = (e as CustomEvent).detail;
      const aid = agentIdRef.current;
      const tok = issuedTokenRef.current || '';

      if (featureId === 'C1') {
        const data = await c1r.current.run(async () => {
          const r = await V2.issueToken({ agent_id: aid, allowed_actions: ['read', 'write'], expiry_seconds: 300 });
          if (!r.error && r.data) setIssuedToken((r.data as { token: string }).token);
          return r;
        });
        dispatch('C1', data, data !== null);
      } else if (featureId === 'C2') {
        const act = inputs?.attemptAction || 'delete';
        setAttemptAction(act);
        const data = await c2r.current.run(() => V2.checkScope({ agent_id: aid, token: tok, action: act }));
        dispatch('C2', data, data !== null);
      } else if (featureId === 'C3') {
        const data = await c3r.current.run(async () => {
          const r = await V2.initiateProof({ agent_id: aid, action: 'Transfer funds', required_approvers: 3 });
          if (!r.error && r.data) setProofId((r.data as { proof_id: string }).proof_id);
          return r;
        });
        dispatch('C3', data, data !== null);
      } else if (featureId === 'C4') {
        const data = await c4r.current.run(() => V2.armoriqGate({ agent_id: aid, action: 'write', token: tok }));
        dispatch('C4', data, data !== null);
      } else if (featureId === 'C5') {
        const data = await c5r.current.run(() => V2.multiStep({ agent_id: aid, token: tok, fail_at_step: 3 }));
        dispatch('C5', data, data !== null);
      } else if (featureId === 'C6') {
        const data = await c1r.current.run(() => V2.issueToken({ agent_id: aid, allowed_actions: ['read'], expiry_seconds: 5 }));
        dispatch('C6', data, data !== null);
      } else if (featureId === 'C7') {
        const data = await c7r.current.run(() => V2.explain({ agent_id: aid, action: 'delete', token: tok || undefined }));
        dispatch('C7', data, data !== null);
      }
    };

    window.addEventListener('triggerFeature', handler);
    return () => window.removeEventListener('triggerFeature', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const c5Steps = c5.result
    ? ((c5.result as Record<string, unknown>).steps as { step: number; status: string; action?: string }[] | undefined)
    : null;

  return (
    <div className="relative min-h-full">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-25">
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

      {/* Content */}
      <div className="relative z-10 p-6 space-y-4">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SparklesText
            text="CRANE — Capability Tokens"
            colors={{ first: "#4488ff", second: "#00ccff" }}
            className="text-xl font-bold"
            sparklesCount={6}
          />
          <p className="text-gray-500 text-sm mt-1">C1–C7 · JWT capability tokens + multi-sig + ArmorIQ policy</p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 xl:grid-cols-2 gap-4"
        >
          {/* C1 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="C1" title="Signed JWT Capability Token (5-min)" accent={A}
              description="Issue Dilithium-signed JWT with allowed actions and expiry"
              onRun={() => c1.run(async () => {
                const r = await V2.issueToken({ agent_id: agentId, allowed_actions: actions, expiry_seconds: expiry });
                if (!r.error && r.data) setIssuedToken((r.data as { token: string }).token);
                return r;
              })}
              running={c1.running} result={c1.result} error={c1.error} proofs={c1.proofs}>
              <div className="space-y-2">
                {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
                <div className="flex flex-wrap gap-2">
                  {ALL_ACTIONS.map(a => (
                    <label key={a} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={actions.includes(a)} onChange={() => toggleAction(a)} className="accent-blue-400" />
                      <span className="text-xs text-gray-300">{a}</span>
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Expiry:</span>
                  <select value={expiry} onChange={e => setExpiry(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white">
                    <option value={300}>5 minutes</option>
                    <option value={5}>5 seconds (C6 test)</option>
                    <option value={3600}>1 hour</option>
                  </select>
                </div>
                <AnimatePresence>
                  {issuedToken && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="text-xs font-mono text-blue/60 break-all bg-white/5 rounded p-2"
                    >
                      Token: {issuedToken.slice(0, 50)}...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FeatureCard>
          </motion.div>

          {/* C2 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="C2" title="Out-of-Scope Action Blocker" accent={A}
              description="Try an action not in the token's allowed_actions"
              onRun={() => c2.run(() => V2.checkScope({ agent_id: agentId, token: issuedToken || "", action: attemptAction }))}
              running={c2.running} result={c2.result} error={c2.error} proofs={c2.proofs}>
              <div className="space-y-2">
                {!issuedToken && <p className="text-amber text-xs">Issue a token first (C1)</p>}
                <div>
                  <label className="text-xs text-gray-500">Action to attempt:</label>
                  <select value={attemptAction} onChange={e => setAttemptAction(e.target.value)}
                    className="mt-1 w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white">
                    {ALL_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                {issuedToken && <p className="text-xs text-gray-500">Token scope: [{actions.join(", ")}]</p>}
              </div>
            </FeatureCard>
          </motion.div>

          {/* C3 — SparklesCore burst at 3/3 threshold */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="C3" title="Dilithium Multi-Sig Capability Proofs" accent={A}
              description="Initiate multi-sig approval → add 3 signatures → threshold met"
              onRun={() => c3.run(async () => {
                setSignCount(0);
                const r = await V2.initiateProof({ agent_id: agentId, action: c3action, required_approvers: 3 });
                if (!r.error && r.data) setProofId((r.data as { proof_id: string }).proof_id);
                return r;
              })}
              running={c3.running} result={c3.result} error={c3.error} proofs={c3.proofs}>
              <div className="space-y-2">
                {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
                <input value={c3action} onChange={e => setC3action(e.target.value)}
                  placeholder="High-value action" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600" />
                {proofId && (
                  <div className="relative">
                    <div className="flex gap-2">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                          <RippleButton
                            variant="default"
                            onClick={() => handleSign(i)}
                            disabled={c3sign.running}
                            className="w-full py-1.5 rounded text-xs font-mono"
                            style={{ color: A, border: `1px solid ${A}44`, background: `${A}11` }}
                            rippleColor={`${A}44`}
                          >
                            Sig {i + 1}
                          </RippleButton>
                        </motion.div>
                      ))}
                    </div>
                    {/* Approval progress */}
                    <div className="mt-2 flex items-center gap-2">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="h-1.5 flex-1 rounded-full"
                          animate={{ background: i < signCount ? A : "rgba(255,255,255,0.08)" }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                        />
                      ))}
                      <span className="text-xs font-mono" style={{ color: A }}>{signCount}/3</span>
                    </div>
                    {/* SparklesCore burst at 3/3 */}
                    <AnimatePresence>
                      {signCount >= 3 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
                        >
                          <SparklesCore
                            background="transparent"
                            particleColor={A}
                            particleDensity={150}
                            minSize={1}
                            maxSize={2.5}
                            speed={0.8}
                            className="w-full h-full"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                {c3sign.result && (
                  <motion.pre
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-green font-mono"
                  >
                    {JSON.stringify(c3sign.result, null, 2)}
                  </motion.pre>
                )}
              </div>
            </FeatureCard>
          </motion.div>

          {/* C4 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="C4" title="ArmorIQ as Second Policy Gate" accent={A}
              description="SQA scope check + ArmorIQ policy check — two independent gates"
              onRun={() => c4.run(() => V2.armoriqGate({ agent_id: agentId, action: c4action, token: issuedToken || "" }))}
              running={c4.running} result={c4.result} error={c4.error} proofs={c4.proofs}>
              <div className="space-y-2">
                {!issuedToken && <p className="text-amber text-xs">Issue a token first (C1)</p>}
                <select value={c4action} onChange={e => setC4action(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white">
                  {ALL_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </FeatureCard>
          </motion.div>

          {/* C5 — stagger step log */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="C5" title="Mid-Execution Checkpoint" accent={A}
              description="Token re-verified at each step boundary — halts if expired/invalid"
              onRun={() => c5.run(() => V2.multiStep({ agent_id: agentId, token: issuedToken || "", fail_at_step: failAt }))}
              running={c5.running} result={null} error={c5.error} proofs={c5.proofs}>
              <div className="space-y-2">
                {!issuedToken && <p className="text-amber text-xs">Issue a token first (C1)</p>}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Force expire at step:</span>
                  <select value={failAt} onChange={e => setFailAt(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white">
                    {[2, 3, 4].map(n => <option key={n} value={n}>Step {n}</option>)}
                  </select>
                </div>
                {c5Steps && (
                  <motion.div
                    variants={stepVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-1 mt-2"
                  >
                    {c5Steps.map((step, i) => (
                      <motion.div
                        key={i}
                        variants={stepItemVariants}
                        className="flex items-center gap-2 py-1 px-2 rounded bg-white/[0.03] border border-white/5"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${step.status === "pass" ? "bg-green" : "bg-red"}`} />
                        <span className="text-xs text-gray-400 font-mono">Step {step.step}</span>
                        <span className={`text-xs font-bold ${step.status === "pass" ? "text-green" : "text-red"}`}>
                          {step.status?.toUpperCase()}
                        </span>
                        {step.action && <span className="text-xs text-gray-600 truncate">{step.action}</span>}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
                {!c5Steps && c5.result && (
                  <pre className="text-xs text-green font-mono whitespace-pre-wrap mt-2">
                    {JSON.stringify(c5.result, null, 2)}
                  </pre>
                )}
              </div>
            </FeatureCard>
          </motion.div>

          {/* C6 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="C6" title="Token Expired Mid-Task Halt" accent={A}
              description="Issue 5s token → wait → use it → 401 EXPIRED"
              onRun={async () => {
                setC6issued(false);
                const data = await c1.run(() => V2.issueToken({ agent_id: agentId, allowed_actions: ["read"], expiry_seconds: 5 }));
                if (data) {
                  const t = (data as { token: string }).token;
                  if (t) { setC6short(t); setC6issued(true); }
                }
              }}
              running={c1.running} result={c6.result} error={c6.error} proofs={c6.proofs}
              badge="Issue 5s token, then test below">
              <div className="space-y-2">
                <AnimatePresence>
                  {c6issued && !c6.result && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-green font-mono"
                    >
                      ✅ 5-second token issued — wait 6 seconds, then click below
                    </motion.p>
                  )}
                </AnimatePresence>
                {c6short && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <RippleButton
                      variant="default"
                      onClick={() => c6.run(() => V2.verifyExpiry({ agent_id: agentId, token: c6short }))}
                      disabled={c6.running}
                      className="w-full py-2 rounded text-xs font-mono"
                      style={{ color: "#ff3333", border: "1px solid rgba(255,50,50,0.3)", background: "rgba(255,50,50,0.05)" }}
                      rippleColor="rgba(255,50,50,0.3)"
                    >
                      {c6.running ? "Testing..." : "[ USE EXPIRED TOKEN ]"}
                    </RippleButton>
                  </motion.div>
                )}
                <p className="text-xs text-gray-600">Step 1: Click [RUN] to issue 5s token. Step 2: Wait 6s. Step 3: Click button above.</p>
              </div>
            </FeatureCard>
          </motion.div>
        </motion.div>

        {/* C7 — SHAP animated BarChart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <FeatureCard id="C7" title="Jade Palace Tribunal — SHAP Explainer" accent={A}
            description="SHAP scores explaining why a capability decision was made"
            onRun={() => c7.run(() => V2.explain({ agent_id: agentId, action: c7action, token: issuedToken || undefined }))}
            running={c7.running} result={null} error={c7.error} proofs={c7.proofs}>
            <div className="space-y-2">
              <select value={c7action} onChange={e => setC7action(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white">
                {ALL_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {c7.result && (() => {
              const d = c7.result as { bar_chart_data: { factor: string; value: number; color: string }[]; explanation: string; decision: string };
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-3 space-y-3"
                >
                  <motion.p
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`text-sm font-bold ${d.decision === "ALLOWED" ? "text-green" : "text-red"}`}
                  >
                    {d.decision}
                  </motion.p>
                  <p className="text-xs text-gray-400">{d.explanation}</p>
                  <motion.div
                    className="h-32"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={d.bar_chart_data} layout="vertical">
                        <XAxis type="number" domain={[-1, 1]} tick={{ fill: "#666", fontSize: 10 }} />
                        <YAxis type="category" dataKey="factor" tick={{ fill: "#999", fontSize: 10 }} width={120} />
                        <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", color: "#fff", fontSize: 11 }} />
                        <Bar dataKey="value" isAnimationActive={true} animationDuration={800}>
                          {d.bar_chart_data.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                </motion.div>
              );
            })()}
          </FeatureCard>
        </motion.div>
      </div>
    </div>
  );
}
