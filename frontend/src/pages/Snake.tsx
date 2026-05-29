import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeatureCard, useFeature } from "../components/FeatureCard";
import { useAgentStore } from "../store/agentStore";
import { V2 } from "../api/client";
import { usePolling } from "../hooks/usePolling";
import { SparklesText } from "../components/ui/sparkles-text";
import ShaderBackground from "../components/ui/shader-background";
import { RippleButton } from "../components/ui/multi-type-ripple-buttons";

const A = "#00ff88";

type TamperStatus = { status: string; message: string; tampered_entries: unknown[]; total_entries: number; last_check: string };
type MerkleTree = { leaves: { id: string; hash: string; action: string; tampered: boolean }[]; levels: string[][]; root: string | null; has_tamper: boolean; tampered_indices: number[] };

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const merkleRowVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const merkleNodeVariants = {
  hidden: { opacity: 0, scale: 0.4 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
};

function MerkleViz({ data }: { data: MerkleTree | null }) {
  if (!data?.leaves?.length) return <p className="text-gray-600 text-xs">No audit entries yet</p>;
  return (
    <motion.div
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      initial="hidden"
      animate="show"
      className="space-y-3 overflow-auto"
    >
      {data.levels.slice().reverse().map((level, li) => {
        const levelIdx = data.levels.length - 1 - li;
        const isLeaf = levelIdx === 0;
        return (
          <motion.div key={li} variants={merkleRowVariants} className="flex gap-2 justify-center flex-wrap">
            {level.map((hash, i) => {
              const isTampered = isLeaf && data.tampered_indices.includes(i);
              return (
                <motion.span
                  key={i}
                  variants={merkleNodeVariants}
                  animate={isTampered ? { boxShadow: ["0 0 0 1px rgba(255,50,50,0.5)", "0 0 8px rgba(255,50,50,0.6)", "0 0 0 1px rgba(255,50,50,0.5)"] } : {}}
                  transition={{ repeat: isTampered ? Infinity : 0, duration: 1.5 }}
                  className={`px-2 py-1 rounded text-xs font-mono border ${isTampered ? "border-red/50 text-red bg-red/10" : "border-green/20 text-green/70 bg-green/5"}`}
                >
                  {hash}
                </motion.span>
              );
            })}
          </motion.div>
        );
      })}
      {data.root && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.span
            animate={{ boxShadow: data.has_tamper ? ["0 0 0 1px rgba(255,50,50,0.5)", "0 0 16px rgba(255,50,50,0.7)", "0 0 0 1px rgba(255,50,50,0.5)"] : ["0 0 0 1px rgba(0,255,136,0.3)", "0 0 12px rgba(0,255,136,0.5)", "0 0 0 1px rgba(0,255,136,0.3)"] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`text-xs font-mono px-3 py-1 rounded border ${data.has_tamper ? "border-red/50 text-red" : "border-green text-green"}`}
          >
            ROOT: {data.root}
          </motion.span>
        </motion.div>
      )}
    </motion.div>
  );
}

export function Snake() {
  const { selectedAgentId } = useAgentStore();
  const agentId = selectedAgentId || "";

  const s1 = useFeature();
  const [action, setAction] = useState("READ_SENSITIVE_DATA");
  const [lastLogId, setLastLogId] = useState<string | null>(null);

  const s2 = useFeature();
  const s3 = useFeature();

  const { data: tamper, loading: tamperLoading } = usePolling<TamperStatus>(
    () => V2.tamperStatus() as Promise<{ data: TamperStatus | null; error: string | null }>, 5000);

  const s4sim = useFeature();

  const s5 = useFeature();
  const [s5action, setS5action] = useState("ARMORIQ_DIRECT_WRITE");

  const s6 = useFeature();

  // Shake state for S4 tamper detection
  const [tamperShake, setTamperShake] = useState(false);
  const prevTamperStatus = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (tamper?.status === "TAMPER_DETECTED" && prevTamperStatus.current !== "TAMPER_DETECTED") {
      setTamperShake(true);
      const t = setTimeout(() => setTamperShake(false), 700);
      return () => clearTimeout(t);
    }
    prevTamperStatus.current = tamper?.status;
  }, [tamper?.status]);

  // Refs for voice event handler
  const s1r = useRef(s1); s1r.current = s1;
  const s2r = useRef(s2); s2r.current = s2;
  const s3r = useRef(s3); s3r.current = s3;
  const s4simr = useRef(s4sim); s4simr.current = s4sim;
  const s5r = useRef(s5); s5r.current = s5;
  const s6r = useRef(s6); s6r.current = s6;
  const agentIdRef = useRef(agentId); agentIdRef.current = agentId;
  const lastLogIdRef = useRef(lastLogId); lastLogIdRef.current = lastLogId;

  useEffect(() => {
    const dispatch = (featureId: string, data: unknown, success: boolean) => {
      window.dispatchEvent(new CustomEvent('featureResult', {
        detail: { featureId, success, summary: success ? 'Complete.' : 'Failed.', data },
      }));
    };

    const handler = async (e: Event) => {
      const { featureId, inputs } = (e as CustomEvent).detail;
      const aid = agentIdRef.current;

      if (featureId === 'S1') {
        const act = inputs?.action || 'voice_test_action';
        setAction(act);
        const data = await s1r.current.run(async () => {
          const r = await V2.auditLog({ agent_id: aid, action_type: act });
          if (!r.error && r.data) setLastLogId((r.data as { log_id: string }).log_id);
          return r;
        });
        dispatch('S1', data, data !== null);
      } else if (featureId === 'S2') {
        const lid = lastLogIdRef.current;
        if (!lid) { dispatch('S2', null, false); return; }
        const data = await s2r.current.run(() => V2.verifyAuditSig(lid));
        dispatch('S2', data, data !== null);
      } else if (featureId === 'S3') {
        const data = await s3r.current.run(() => V2.verifyChain());
        dispatch('S3', data, data !== null);
      } else if (featureId === 'S4') {
        const data = await s4simr.current.run(() => V2.simulateTamper());
        dispatch('S4', data, data !== null);
      } else if (featureId === 'S5') {
        const data = await s5r.current.run(() => V2.armoriqAuditLog({ agent_id: aid, action: 'VOICE_ARMORIQ_WRITE' }));
        dispatch('S5', data, data !== null);
      } else if (featureId === 'S6') {
        const data = await s6r.current.run(() => V2.merkleCheckpoint());
        dispatch('S6', data, data !== null);
      } else if (featureId === 'S7') {
        dispatch('S7', { status: 'Live Merkle tree active' }, true);
      }
    };

    window.addEventListener('triggerFeature', handler);
    return () => window.removeEventListener('triggerFeature', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: merkleTree } = usePolling<MerkleTree>(
    () => V2.merkleTree() as Promise<{ data: MerkleTree | null; error: string | null }>, 5000);

  return (
    <div className="relative min-h-full">
      {/* Shader background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <ShaderBackground className="absolute inset-0 w-full h-full opacity-30" />
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
            text="SNAKE — Immutable Audit Chain"
            colors={{ first: "#00ff88", second: "#00ccaa" }}
            className="text-xl font-bold"
            sparklesCount={6}
          />
          <p className="text-gray-500 text-sm mt-1">S1–S7 · SHA-3-256 + Dilithium-3 hash chain with Merkle checkpoints</p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 xl:grid-cols-2 gap-4"
        >
          {/* S1 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="S1" title="SHA-3-256 Immutable Audit Ledger" accent={A}
              description="Log action with SHA3-256 hash chain + Dilithium-3 signature"
              onRun={() => s1.run(async () => {
                const r = await V2.auditLog({ agent_id: agentId, action_type: action });
                if (!r.error && r.data) setLastLogId((r.data as { log_id: string }).log_id);
                return r;
              })}
              running={s1.running} result={s1.result} error={s1.error} proofs={s1.proofs}>
              <div className="space-y-2">
                {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
                <input value={action} onChange={e => setAction(e.target.value)}
                  placeholder="Action type" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600" />
              </div>
            </FeatureCard>
          </motion.div>

          {/* S2 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="S2" title="Dilithium-3 Quantum Audit Signing" accent={A}
              description="Verify Dilithium-3 signature on an audit log entry"
              onRun={() => s2.run(() => {
                if (!lastLogId) return Promise.resolve({ data: null, error: "Run S1 first to get a log ID", raw: null });
                return V2.verifyAuditSig(lastLogId);
              })}
              running={s2.running} result={s2.result} error={s2.error} proofs={s2.proofs}>
              {lastLogId ? (
                <p className="text-xs text-gray-500 font-mono">log_id: {lastLogId.slice(0, 16)}...</p>
              ) : (
                <p className="text-amber text-xs">Run S1 first to get a log_id</p>
              )}
            </FeatureCard>
          </motion.div>

          {/* S3 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="S3" title="Hash Chain Continuity Verification" accent={A}
              description="Verify the entire audit chain — every hash links correctly"
              onRun={() => s3.run(() => V2.verifyChain())}
              running={s3.running} result={s3.result} error={s3.error} proofs={s3.proofs} />
          </motion.div>

          {/* S4 — shake on TAMPER_DETECTED */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
            animate={tamperShake ? { x: [0, -8, 8, -8, 8, -4, 4, -2, 2, 0] } : {}}
            transition={{ duration: 0.6 }}
          >
            <FeatureCard id="S4" title="Live Tamper Detection (auto, 5s)" accent={A}
              description="Auto-checks chain every 5s · [SIMULATE TAMPER] to test detection">
              <div className="space-y-3">
                <motion.div
                  animate={{
                    borderColor: tamper?.status === "TAMPER_DETECTED" ? "#ff333366" : "#00ff8844",
                    backgroundColor: tamper?.status === "TAMPER_DETECTED" ? "rgba(255,50,50,0.05)" : "rgba(0,255,136,0.05)",
                  }}
                  transition={{ duration: 0.4 }}
                  className={`px-3 py-2 rounded border text-xs font-mono ${tamper?.status === "TAMPER_DETECTED" ? "text-red" : "text-green"}`}
                >
                  {tamperLoading ? "Checking..." : tamper?.message || "Waiting for first check..."}
                </motion.div>
                <AnimatePresence>
                  {tamper?.tampered_entries?.length ? (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-gray-500"
                    >
                      {tamper.tampered_entries.length} tampered entr{tamper.tampered_entries.length === 1 ? "y" : "ies"} found
                    </motion.p>
                  ) : null}
                </AnimatePresence>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <RippleButton
                    variant="default"
                    onClick={() => s4sim.run(() => V2.simulateTamper())}
                    disabled={s4sim.running}
                    className="w-full py-1.5 rounded text-xs font-mono"
                    style={{ color: "#ff3333", border: "1px solid rgba(255,50,50,0.3)", background: "rgba(255,50,50,0.05)" }}
                    rippleColor="rgba(255,50,50,0.3)"
                  >
                    {s4sim.running ? "Tampering..." : "[ SIMULATE TAMPER ]"}
                  </RippleButton>
                </motion.div>
                {s4sim.result && (
                  <motion.pre
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-amber font-mono"
                  >
                    {JSON.stringify(s4sim.result, null, 2)}
                  </motion.pre>
                )}
              </div>
            </FeatureCard>
          </motion.div>

          {/* S5 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="S5" title="ArmorIQ Writes Directly to Audit" accent={A}
              description="ArmorIQ SDK writes log → mirrors to Supabase — both IDs shown"
              onRun={() => s5.run(() => V2.armoriqAuditLog({ agent_id: agentId, action: s5action }))}
              running={s5.running} result={s5.result} error={s5.error} proofs={s5.proofs}>
              <div className="space-y-2">
                {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
                <input value={s5action} onChange={e => setS5action(e.target.value)}
                  placeholder="Action type" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600" />
              </div>
            </FeatureCard>
          </motion.div>

          {/* S6 — pulsing border during checkpoint generation */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
            animate={s6.running ? { boxShadow: ["0 0 0 1px rgba(0,255,136,0.2)", "0 0 16px rgba(0,255,136,0.5)", "0 0 0 1px rgba(0,255,136,0.2)"] } : {}}
            transition={{ repeat: s6.running ? Infinity : 0, duration: 1 }}
            className="rounded-xl"
          >
            <FeatureCard id="S6" title="Merkle Tree Checkpoint" accent={A}
              description="Build Merkle tree from all audit log hashes → store root"
              onRun={() => s6.run(() => V2.merkleCheckpoint())}
              running={s6.running} result={s6.result} error={s6.error} proofs={s6.proofs} />
          </motion.div>
        </motion.div>

        {/* S7 — Sacred Peach Tree */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <FeatureCard id="S7" title="Sacred Peach Tree — Live Merkle Visualization" accent={A}
            description="Live Merkle tree SVG — red nodes = tampered. Auto-refreshes every 5s.">
            <MerkleViz data={merkleTree} />
          </FeatureCard>
        </motion.div>
      </div>
    </div>
  );
}
