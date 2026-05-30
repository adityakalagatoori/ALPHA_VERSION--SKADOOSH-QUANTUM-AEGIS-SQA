import { motion } from "framer-motion";
import { FeatureCard, useFeature } from "../components/FeatureCard";
import { useAgentStore } from "../store/agentStore";
import { V2 } from "../api/client";
import { SparklesText } from "../components/ui/sparkles-text";

const A = "#00ff88";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export function Snake() {
  const { selectedAgentId } = useAgentStore();
  const agentId = selectedAgentId || "";

  const sealChain = useFeature();
  const triggerTamper = useFeature();
  const checkpoint = useFeature();

  const body = { agent_id: agentId || "DEMO-AGENT" };

  return (
    <div className="relative min-h-full bg-[#050f0a]">
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(0,255,136,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(0,200,100,0.03) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <SparklesText
            text="THE PEACH TREE SCROLL"
            colors={{ first: "#00ff88", second: "#00cc66" }}
            className="text-2xl font-bold tracking-tight"
            sparklesCount={8}
          />
          <p className="text-gray-500 text-sm mt-1">
            SNAKE · S1–S7 · SHA-3-256 immutable audit ledger + Merkle checkpoints + live tamper detection
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {["S1 SHA-3 Ledger", "S2 Dilithium Sign", "S3 Hash Chain", "S4 Tamper Detect", "S5 ArmorIQ Write", "S6 Merkle Tree", "S7 Sacred Peach"].map(
              f => (
                <span
                  key={f}
                  className="text-xs px-2 py-0.5 rounded border border-green-700/40 text-green-500 bg-green-900/10 font-mono"
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
          {/* ACTION 1 — SEAL CHAIN */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard
              id="SEAL CHAIN"
              title="SHA-3 Hash Chain + Dilithium Audit Signatures"
              accent={A}
              description="Write 3 audit entries with SHA-3-256 hash chaining. Each entry Dilithium-3 signed. ArmorIQ logs all entries directly."
              badge="S1 · S2 · S3 · S5"
              onRun={() => sealChain.run(() => V2.peachSealChain(body))}
              running={sealChain.running}
              result={sealChain.result}
              error={sealChain.error}
              proofs={sealChain.proofs}
            >
              <p className="text-gray-600 text-xs">
                Writes to <code className="text-green/60">audit_logs</code>. Each hash = SHA3(agent|action|prev_hash|timestamp).
                Real Dilithium-3 signature per entry.
              </p>
            </FeatureCard>
          </motion.div>

          {/* ACTION 2 — TRIGGER TAMPER */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard
              id="TAMPER DETECTION"
              title="Live Tamper Detection — Hash Chain Corruption"
              accent={A}
              description="Corrupt the latest audit entry hash, verify the chain break fires, auto-restore. Real-time integrity detection."
              badge="S4 · Live Detection"
              onRun={() => triggerTamper.run(() => V2.peachTriggerTamper(body))}
              running={triggerTamper.running}
              result={triggerTamper.result}
              error={triggerTamper.error}
              proofs={triggerTamper.proofs}
            >
              <div className="space-y-1">
                <p className="text-gray-600 text-xs">
                  Mutates <code className="text-red-400/60">current_hash</code> → "TAMPERED_…", detects chain break,
                  restores. Response shows corrupted vs expected hash.
                </p>
                <p className="text-amber-600/70 text-xs">Run Seal Chain first to have entries to tamper</p>
              </div>
            </FeatureCard>
          </motion.div>

          {/* ACTION 3 — CHECKPOINT MERKLE */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard
              id="MERKLE CHECKPOINT"
              title="Merkle Tree Checkpoint — The Sacred Peach Tree"
              accent={A}
              description="Build Merkle tree from all audit logs. Show Sacred Peach Tree branch health (GREEN/RED). Write checkpoint to ledger."
              badge="S6 · S7 · Merkle Root"
              onRun={() => checkpoint.run(() => V2.peachCheckpointMerkle(body))}
              running={checkpoint.running}
              result={checkpoint.result}
              error={checkpoint.error}
              proofs={checkpoint.proofs}
            >
              <p className="text-gray-600 text-xs">
                Iterative Merkle pairing over all <code className="text-green/60">audit_logs</code>. Root hash stored as
                checkpoint. Branch colors: GREEN = intact, RED = tampered.
              </p>
            </FeatureCard>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
