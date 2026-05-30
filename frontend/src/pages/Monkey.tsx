import { useState } from "react";
import { motion } from "framer-motion";
import { FeatureCard, useFeature } from "../components/FeatureCard";
import { useAgentStore } from "../store/agentStore";
import { V2 } from "../api/client";
import { SparklesText } from "../components/ui/sparkles-text";
import { SmokeBackground } from "../components/ui/spooky-smoke-animation";

const A = "#ffd700";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export function Monkey() {
  const { selectedAgentId, agents, setAgents } = useAgentStore();
  const agentId = selectedAgentId || "";

  // Scroll Action 1 — Forge Identity (M1+M2+M3+M6)
  const forge = useFeature();
  const [name, setName] = useState("Agent-" + Math.random().toString(36).slice(2, 6).toUpperCase());
  const [sector, setSector] = useState("banking");

  // Scroll Action 2 — Seal Payload (M5)
  const seal = useFeature();
  const [sealMsg, setSealMsg] = useState("Transfer $500 to account ACCT-12345");
  const [replay, setReplay] = useState(false);
  const [lastNonce, setLastNonce] = useState<string | null>(null);

  // Scroll Action 3 — Blacklist Alert (M4+M7)
  const blacklist = useFeature();
  const [reason, setReason] = useState("Suspicious activity detected");

  const refreshAgents = async () => {
    const res = await V2.trustScores();
    if (res.data) {
      const list = (res.data as { agents: typeof agents }).agents || [];
      setAgents(list);
    }
  };

  return (
    <div className="relative min-h-full">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <SmokeBackground smokeColor="#0a1a0a" />
      </div>

      <div className="relative z-10 p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <SparklesText
            text="THE WARDEN'S SCROLL"
            colors={{ first: "#ffd700", second: "#c9a227" }}
            className="text-2xl font-bold tracking-tight"
            sparklesCount={8}
          />
          <p className="text-gray-500 text-sm mt-1">
            MONKEY · M1–M7 · Kyber-1024 + Dilithium-3 post-quantum identity management
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {["M1 Keypair", "M2 Entropy", "M3 Sig Gate", "M4 Blacklist", "M5 Replay Seal", "M6 Enclave", "M7 Alerts"].map(f => (
              <span key={f} className="text-xs px-2 py-0.5 rounded border border-yellow-700/40 text-yellow-600 bg-yellow-900/10 font-mono">{f}</span>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {/* ACTION 1 — FORGE IDENTITY */}
          <motion.div variants={cardVariants} whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}>
            <FeatureCard
              id="FORGE IDENTITY"
              title="CRYSTALS-Suite Registration + Enclave Shield"
              accent={A}
              description="Generate live Kyber-1024 + ML-DSA-65 keypair, register agent, verify signature, return enclave noise proof"
              badge="M1 · M2 · M3 · M6"
              onRun={() =>
                forge.run(async () => {
                  const r = await V2.wardenForgeIdentity({ name, sector, allowed_actions: ["read", "write", "payments"] });
                  if (!r.error) await refreshAgents();
                  return r;
                })
              }
              running={forge.running}
              result={forge.result}
              error={forge.error}
              proofs={forge.proofs}
            >
              <div className="space-y-2">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Agent name"
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-700/60"
                />
                <select
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-700/60"
                >
                  {["banking", "healthcare", "legal", "government", "trading", "insurance", "crypto", "enterprise"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <p className="text-gray-600 text-xs">Creates agent, generates quantum keypairs, signs test message, returns enclave shield proof</p>
              </div>
            </FeatureCard>
          </motion.div>

          {/* ACTION 2 — SEAL PAYLOAD */}
          <motion.div variants={cardVariants} whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}>
            <FeatureCard
              id="SEAL PAYLOAD"
              title="Replay-Sealed Payload — Nonce Guard"
              accent={A}
              description="Sign message with nonce + timestamp. Enable replay toggle to prove second send is BLOCKED"
              badge="M5 · Replay Protection"
              onRun={() =>
                seal.run(async () => {
                  const r = await V2.wardenSealPayload({
                    agent_id: agentId || "DEMO-AGENT",
                    message: sealMsg,
                    replay,
                  });
                  if (!r.error && r.data) {
                    const d = r.data as { nonce?: string };
                    if (d.nonce) setLastNonce(d.nonce);
                  }
                  return r;
                })
              }
              running={seal.running}
              result={seal.result}
              error={seal.error}
              proofs={seal.proofs}
              badge={lastNonce ? (replay ? "REPLAY MODE — expect BLOCKED" : "Nonce stored — toggle replay to test") : undefined}
            >
              <div className="space-y-2">
                {!agentId && <p className="text-amber-500 text-xs">Select an agent from the top bar or Forge Identity first</p>}
                <input
                  value={sealMsg}
                  onChange={e => setSealMsg(e.target.value)}
                  placeholder="Payload message"
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                />
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={replay}
                    onChange={e => setReplay(e.target.checked)}
                    className="accent-red-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-400">
                    Replay attack mode
                    {lastNonce && replay && <span className="text-red-400 ml-2 font-mono text-xs">(nonce already used — expect BLOCKED)</span>}
                  </span>
                </label>
                {lastNonce && (
                  <p className="text-xs text-gray-600 font-mono">
                    Last nonce: {lastNonce.slice(0, 20)}...{" "}
                    <button onClick={() => { setLastNonce(null); setReplay(false); }} className="text-red-600 hover:text-red-400 ml-1">clear</button>
                  </p>
                )}
              </div>
            </FeatureCard>
          </motion.div>

          {/* ACTION 3 — BLACKLIST ALERT */}
          <motion.div variants={cardVariants} whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}>
            <FeatureCard
              id="BLACKLIST ALERT"
              title="Key Blacklisting + Oogway's Signal"
              accent={A}
              description="Blacklist agent key (trust score → 0), trigger Oogway alert notification pipeline"
              badge="M4 · M7 · Identity Revocation"
              onRun={() =>
                blacklist.run(() =>
                  V2.wardenBlacklistAlert({
                    agent_id: agentId || "DEMO-AGENT",
                    reason,
                  })
                )
              }
              running={blacklist.running}
              result={blacklist.result}
              error={blacklist.error}
              proofs={blacklist.proofs}
            >
              <div className="space-y-2">
                {!agentId && <p className="text-amber-500 text-xs">Select an agent from the top bar</p>}
                <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Blacklist reason"
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                />
                <p className="text-gray-600 text-xs">Writes to Supabase agents table, fires ArmorIQ alert, returns Oogway signal status</p>
              </div>
            </FeatureCard>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
