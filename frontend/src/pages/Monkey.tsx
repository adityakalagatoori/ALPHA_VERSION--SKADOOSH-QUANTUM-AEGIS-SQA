import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeatureCard, useFeature } from "../components/FeatureCard";
import { useAgentStore } from "../store/agentStore";
import { V2 } from "../api/client";
import { usePolling } from "../hooks/usePolling";
import { SparklesText } from "../components/ui/sparkles-text";
import { SmokeBackground } from "../components/ui/spooky-smoke-animation";
import { RippleButton } from "../components/ui/multi-type-ripple-buttons";
import clsx from "clsx";

const A = "#ffd700";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function Monkey() {
  const { selectedAgentId, agents, setAgents } = useAgentStore();
  const agentId = selectedAgentId || "";

  // M1 — Register Agent
  const m1 = useFeature();
  const [name, setName] = useState("Agent-" + Math.random().toString(36).slice(2, 6));
  const [sector, setSector] = useState("banking");

  // M2 — Generate Keypair
  const m2 = useFeature();

  // M3 — Verify Signature
  const m3 = useFeature();
  const [message, setMessage] = useState("Hello from SQA");
  const [tamper, setTamper] = useState(false);

  // M4 — Blacklist
  const m4 = useFeature();
  const [reason, setReason] = useState("Suspicious activity detected");
  const m4test = useFeature();

  // M5 — Replay
  const m5 = useFeature();
  const [m5msg, setM5msg] = useState("Transfer $500 to account X");
  const [m5nonce, setM5nonce] = useState<string | null>(null);

  // M6 — Enclave
  const m6 = useFeature();

  // M7 — Oogway alerts
  const { data: alerts } = usePolling<{ alerts: unknown[] }>(
    () => V2.identityAlerts() as Promise<{ data: { alerts: unknown[] } | null; error: string | null }>,
    3000
  );

  const refreshAgents = async () => {
    const res = await V2.trustScores();
    if (res.data) {
      const list = (res.data as { agents: typeof agents }).agents || [];
      setAgents(list);
    }
  };

  // Refs so the voice event handler always reads the latest values
  const m1r = useRef(m1); m1r.current = m1;
  const m2r = useRef(m2); m2r.current = m2;
  const m3r = useRef(m3); m3r.current = m3;
  const m4r = useRef(m4); m4r.current = m4;
  const m5r = useRef(m5); m5r.current = m5;
  const m6r = useRef(m6); m6r.current = m6;
  const agentIdRef = useRef(agentId); agentIdRef.current = agentId;
  const refreshAgentsRef = useRef(refreshAgents); refreshAgentsRef.current = refreshAgents;

  // Voice event integration — listens for Dragon Warrior triggerFeature commands
  useEffect(() => {
    const dispatch = (featureId: string, data: unknown, success: boolean) => {
      const summary = success
        ? JSON.stringify(data).slice(0, 80)
        : 'Feature failed.';
      window.dispatchEvent(new CustomEvent('featureResult', {
        detail: { featureId, success, summary, data },
      }));
    };

    const handler = async (e: Event) => {
      const { featureId, inputs } = (e as CustomEvent).detail;
      const aid = agentIdRef.current;

      if (featureId === 'M1') {
        const n = inputs?.name || 'VoiceAgent_' + Date.now();
        const s = inputs?.sector || 'banking';
        setName(n); setSector(s);
        const data = await m1r.current.run(async () => {
          const r = await V2.registerAgent({ name: n, sector: s, allowed_actions: ['read', 'write'] });
          if (!r.error) await refreshAgentsRef.current();
          return r;
        });
        dispatch('M1', data, data !== null);
      } else if (featureId === 'M2') {
        const data = await m2r.current.run(() => V2.generateKeypair());
        dispatch('M2', data, data !== null);
      } else if (featureId === 'M3') {
        const data = await m3r.current.run(() =>
          V2.verifySignature({ agent_id: aid, message: 'Hello from Dragon Warrior', tamper: false })
        );
        dispatch('M3', data, data !== null);
      } else if (featureId === 'M4') {
        const r = inputs?.reason || 'Voice command blacklist test';
        setReason(r);
        const data = await m4r.current.run(() => V2.blacklistAgent(aid, { reason: r }));
        dispatch('M4', data, data !== null);
      } else if (featureId === 'M5') {
        const data = await m5r.current.run(() =>
          V2.sendSigned({ agent_id: aid, message: 'Dragon Warrior replay test' })
        );
        dispatch('M5', data, data !== null);
      } else if (featureId === 'M6') {
        const data = await m6r.current.run(() => V2.enclaveCheck(aid));
        dispatch('M6', data, data !== null);
      } else if (featureId === 'M7') {
        dispatch('M7', { status: 'Live feed active' }, true);
      }
    };

    window.addEventListener('triggerFeature', handler);
    return () => window.removeEventListener('triggerFeature', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isBlacklisted = !!(m4.result && JSON.stringify(m4.result).toLowerCase().includes('blacklist'));

  return (
    <div className="relative min-h-full">
      {/* Smoke background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <SmokeBackground smokeColor="#0a1a0a" />
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
            text="MONKEY — Quantum Identity"
            colors={{ first: "#ffd700", second: "#c9a227" }}
            className="text-xl font-bold"
            sparklesCount={6}
          />
          <p className="text-gray-500 text-sm mt-1">M1–M7 · Kyber-1024 + Dilithium-3 identity management</p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 xl:grid-cols-2 gap-4"
        >
          {/* M1 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="M1" title="CRYSTALS-Suite Keypair Registration" accent={A}
              description="Register agent with Kyber-1024 + Dilithium-3 (pool-based, fast)"
              onRun={() => m1.run(async () => {
                const r = await V2.registerAgent({ name, sector, allowed_actions: ["read", "write"] });
                if (!r.error) await refreshAgents();
                return r;
              })}
              running={m1.running} result={m1.result} error={m1.error} proofs={m1.proofs}>
              <div className="space-y-2">
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Agent name" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600" />
                <select value={sector} onChange={e => setSector(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white">
                  {["banking","healthcare","legal","government","enterprise"].map(s =>
                    <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </FeatureCard>
          </motion.div>

          {/* M2 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="M2" title="Quantum Entropy Key Generation" accent={A}
              description="Generate one Kyber-1024 + Dilithium-3 keypair into the pool"
              onRun={() => m2.run(() => V2.generateKeypair())}
              running={m2.running} result={m2.result} error={m2.error} proofs={m2.proofs} />
          </motion.div>

          {/* M3 — animated border reflects tamper state */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
            animate={{
              boxShadow: tamper
                ? "0 0 0 2px #ff3333, 0 0 16px rgba(255,50,50,0.25)"
                : "0 0 0 2px rgba(0,255,136,0.3), 0 0 16px rgba(0,255,136,0.05)",
            }}
            transition={{ duration: 0.3 }}
            className="rounded-xl"
          >
            <FeatureCard id="M3" title="Dilithium-3 Signature Verification Gate" accent={A}
              description="Sign a message with agent's Dilithium key and verify (or tamper)"
              onRun={() => m3.run(() => V2.verifySignature({ agent_id: agentId, message, tamper }))}
              running={m3.running} result={m3.result} error={m3.error} proofs={m3.proofs}>
              <div className="space-y-2">
                {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
                <input value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Message to sign" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={tamper} onChange={e => setTamper(e.target.checked)}
                    className="accent-red-500" />
                  <span className="text-sm text-gray-400">Tamper the signature (simulate attack)</span>
                </label>
              </div>
            </FeatureCard>
          </motion.div>

          {/* M4 — red glow pulses when agent is blacklisted */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
            animate={{
              boxShadow: isBlacklisted
                ? "0 0 0 2px #ff3333, 0 0 28px rgba(255,50,50,0.5)"
                : "0 0 0 0 transparent",
            }}
            transition={{ duration: 0.4 }}
            className="rounded-xl"
          >
            <FeatureCard id="M4" title="Key Blacklisting" accent={A}
              description="Blacklist agent key → subsequent requests return 403"
              onRun={() => m4.run(() => V2.blacklistAgent(agentId, { reason }))}
              running={m4.running} result={m4.result} error={m4.error} proofs={m4.proofs}>
              <div className="space-y-2">
                {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
                <input value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Blacklist reason" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600" />
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <RippleButton
                    variant="default"
                    onClick={() => m4test.run(() => V2.testBlacklisted(agentId))}
                    disabled={m4test.running}
                    className="w-full py-2 rounded text-xs font-mono"
                    style={{ color: "#ff3333", border: "1px solid rgba(255,50,50,0.3)", background: "rgba(255,50,50,0.05)" }}
                    rippleColor="rgba(255,50,50,0.3)"
                  >
                    {m4test.running ? "Testing..." : "[ TEST BLACKLISTED REQUEST ]"}
                  </RippleButton>
                </motion.div>
                {m4test.result && (
                  <pre className="text-xs text-green font-mono whitespace-pre-wrap">
                    {JSON.stringify(m4test.result, null, 2)}
                  </pre>
                )}
                {m4test.error && (
                  <pre className="text-xs text-red font-mono whitespace-pre-wrap">{m4test.error}</pre>
                )}
              </div>
            </FeatureCard>
          </motion.div>

          {/* M5 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="M5" title="Replay-Sealed Payloads" accent={A}
              description="Sign & send once (nonce stored) → replay same packet → BLOCKED"
              onRun={() => m5.run(async () => {
                const r = await V2.sendSigned({ agent_id: agentId, message: m5msg, nonce: m5nonce || undefined });
                if (!r.error && r.data) {
                  const d = r.data as { nonce: string };
                  setM5nonce(d.nonce);
                }
                return r;
              })}
              running={m5.running} result={m5.result} error={m5.error} proofs={m5.proofs}
              badge={m5nonce ? "Nonce stored — replay to test" : undefined}>
              <div className="space-y-2">
                {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
                <input value={m5msg} onChange={e => setM5msg(e.target.value)}
                  placeholder="Payload message" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600" />
                {m5nonce && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-mono">Nonce: {m5nonce.slice(0, 12)}...</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setM5nonce(null)}
                      className="text-xs text-red/60 hover:text-red"
                    >
                      Clear
                    </motion.button>
                  </div>
                )}
              </div>
            </FeatureCard>
          </motion.div>

          {/* M6 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 30 } }}
          >
            <FeatureCard id="M6" title="Secure Enclave Shield" accent={A}
              description="Attempt memory dump — private key is enclave-protected, returns only noise"
              onRun={() => m6.run(() => V2.enclaveCheck(agentId))}
              running={m6.running} result={m6.result} error={m6.error} proofs={m6.proofs}>
              {!agentId && <p className="text-amber text-xs">Select an agent above</p>}
            </FeatureCard>
          </motion.div>
        </motion.div>

        {/* M7 — Live alert feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <FeatureCard id="M7" title="Oogway's Signal — Real-Time Identity Alerts" accent={A}
            description="Live identity threat alert feed (auto-refreshes every 3s)">
            <div className="space-y-1.5 max-h-56 overflow-auto">
              {!alerts?.alerts?.length ? (
                <p className="text-gray-600 text-xs">No identity threats yet. Run M3 (tamper) or M4 to generate alerts.</p>
              ) : (
                <AnimatePresence initial={false}>
                  {(alerts.alerts as Record<string, unknown>[]).map((a, i) => (
                    <motion.div
                      key={`${String(a.type)}-${String(a.agent_name)}-${String(a.timestamp)}-${i}`}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-start gap-2 py-1.5 px-2 rounded bg-white/[0.02] border border-white/5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={clsx(
                              "text-red text-xs font-bold",
                              String(a.type) === "BLOCKED_ACTION" && "animate-pulse"
                            )}
                          >
                            {String(a.type)}
                          </span>
                          <span className="text-gray-500 text-xs">{String(a.agent_name)}</span>
                        </div>
                        <p className="text-gray-400 text-xs">{String(a.reason || a.action || "")}</p>
                      </div>
                      <span className="text-gray-600 text-xs flex-shrink-0">
                        {a.timestamp ? new Date(String(a.timestamp)).toLocaleTimeString("en-IN") : ""}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </FeatureCard>
        </motion.div>
      </div>
    </div>
  );
}
