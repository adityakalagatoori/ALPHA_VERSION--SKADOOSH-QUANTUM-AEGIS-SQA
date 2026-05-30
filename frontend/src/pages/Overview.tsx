import { useEffect, useState } from "react";
import { ScrollText as ScrollIcon } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { usePolling } from "../hooks/usePolling";
import { V2 } from "../api/client";
import { SparklesText } from "../components/ui/sparkles-text";
import { SparklesCore } from "../components/ui/sparkles";
import ShaderBackground from "../components/ui/shader-background";
import { InteractiveLogo } from "../components/InteractiveLogo";
import clsx from "clsx";

type Stats = {
  total_agents: number;
  total_audit_logs: number;
  total_actions: number;
  honeypot_count: number;
  keypair_pool_remaining: number;
  merkle_root: { root_hash: string; entry_count: number; created_at: string } | null;
  trust_leaderboard: { agent_id: string; name: string; trust_score: number; sector: string }[];
  audit_feed: { log_id: string; agent_id: string; action_type: string; timestamp: string }[];
};

function CountingNumber({ value, color = "#00ff88" }: { value: number | string; color?: string }) {
  const isNum = typeof value === "number";
  const count = useMotionValue(0);
  const spring = useSpring(count, { stiffness: 60, damping: 20 });
  const rounded = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    if (isNum) count.set(value as number);
  }, [value, count, isNum]);

  if (!isNum) return <span style={{ color }}>{value}</span>;
  return <motion.span style={{ color }}>{rounded}</motion.span>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

function Stat({
  label, value, color = "#00ff88",
}: { label: string; value: number | string; color?: string }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(0,255,136,0.2)" }}
      className="rounded-xl border border-white/10 bg-[#161616]/80 backdrop-blur-sm p-4"
    >
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono">
        <CountingNumber value={value} color={color} />
      </p>
    </motion.div>
  );
}

type ComplianceScore = { passed: number; partial: number; failed: number; total: number; grade: string };
type ComplianceReport = { generated_at: string; score: ComplianceScore; coverage: Record<string, number | string | null> };

export function Overview() {
  const { data, loading } = usePolling<Stats>(
    () => V2.overviewStats() as Promise<{ data: Stats | null; error: string | null }>,
    5000
  );
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceData, setComplianceData] = useState<ComplianceReport | null>(null);
  const [complianceOpen, setComplianceOpen] = useState(false);

  async function fetchCompliance() {
    setComplianceLoading(true);
    const res = await (V2.complianceReport() as Promise<{ data: ComplianceReport | null; error: string | null }>);
    setComplianceLoading(false);
    if (res.data) { setComplianceData(res.data); setComplianceOpen(true); }
  }

  return (
    <div className="relative min-h-full">
      {/* WebGL Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <ShaderBackground className="absolute inset-0 w-full h-full opacity-40" />
      </div>

      {/* Gold sparkle overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <SparklesCore
          background="transparent"
          particleColor="#c9a227"
          particleDensity={50}
          minSize={0.8}
          maxSize={1.4}
          speed={0.3}
          className="w-full h-full"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 space-y-6">
        {/* Hero — InteractiveLogo + title */}
        <div className="flex flex-col items-center">
          <InteractiveLogo size="lg" />
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.1 }}
            className="text-center -mt-4"
          >
            <SparklesText
              text="SKADOOSH QUANTUM AEGIS"
              colors={{ first: "#00ff88", second: "#c9a227" }}
              className="text-xl font-bold text-white"
              sparklesCount={6}
            />
            <p className="text-gray-500 text-sm mt-1">Live system status across all 47 features</p>
          </motion.div>
        </div>

        {/* Compliance Report button */}
        <div className="flex justify-end">
          <button
            onClick={fetchCompliance}
            disabled={complianceLoading}
            className="text-xs font-mono px-4 py-2 rounded-lg border transition-all disabled:opacity-50"
            style={{ borderColor: "rgba(167,139,250,0.3)", color: "#a78bfa", background: "rgba(167,139,250,0.06)" }}
          >
            {complianceLoading ? "Generating…" : <span className="flex items-center gap-1.5"><ScrollIcon size={12} strokeWidth={1.5} /> Compliance Report</span>}
          </button>
        </div>

        {/* Compliance Panel */}
        <AnimatePresence>
          {complianceOpen && complianceData && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-xl border border-purple-500/20 bg-[#161616]/90 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold text-sm">Compliance Report</span>
                  <span
                    className="text-2xl font-bold font-mono"
                    style={{ color: complianceData.score.grade === "A" ? "#00ff88" : complianceData.score.grade === "B" ? "#ffaa00" : "#ff3333" }}
                  >
                    {complianceData.score.grade}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {complianceData.score.passed}/{complianceData.score.total} controls passed
                  </span>
                </div>
                <button onClick={() => setComplianceOpen(false)} className="text-gray-600 hover:text-white text-xs">✕</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {["SOC2", "NIST AI RMF", "GDPR", "ISO 27001"].map((fw) => (
                  <div key={fw} className="rounded bg-black/30 p-2 text-center text-purple-300">{fw}</div>
                ))}
              </div>
              <p className="text-gray-600 text-xs">
                Generated: {new Date(complianceData.generated_at).toLocaleString("en-IN")} · Covers {complianceData.coverage.total_agents ?? 0} agents, {complianceData.coverage.audit_entries ?? 0} audit entries
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats grid */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          <Stat label="Registered Agents" value={data?.total_agents ?? "—"} />
          <Stat label="Audit Log Entries" value={data?.total_audit_logs ?? "—"} color="#4488ff" />
          <Stat label="Total Actions" value={data?.total_actions ?? "—"} color="#00ccaa" />
          <Stat label="Honeypot Agents" value={data?.honeypot_count ?? "—"} color="#ff6600" />
          <Stat label="Keypair Pool" value={data?.keypair_pool_remaining ?? "—"} color="#ffd700" />
          <Stat label="Merkle Entries" value={data?.merkle_root?.entry_count ?? "—"} color="#ff3333" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Merkle Root */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-xl border border-white/10 bg-[#161616]/80 backdrop-blur-sm p-4"
            style={{ boxShadow: "0 0 0 1px rgba(0,255,136,0.1)" }}
          >
            <h3 className="text-white text-sm font-semibold mb-3">Current Merkle Root</h3>
            {data?.merkle_root ? (
              <div className="font-mono text-xs space-y-1">
                <motion.p
                  key={data.merkle_root.root_hash}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green break-all animate-jade-pulse"
                >
                  {data.merkle_root.root_hash}
                </motion.p>
                <p className="text-gray-500">
                  {data.merkle_root.entry_count} entries ·{" "}
                  {new Date(data.merkle_root.created_at).toLocaleString("en-IN")}
                </p>
              </div>
            ) : (
              <p className="text-gray-600 text-xs">No Merkle checkpoint yet — run S6 to generate</p>
            )}
          </motion.div>

          {/* Trust Score Leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-xl border border-white/10 bg-[#161616]/80 backdrop-blur-sm p-4"
          >
            <h3 className="text-white text-sm font-semibold mb-3">Trust Score Leaderboard</h3>
            {!data?.trust_leaderboard?.length ? (
              <p className="text-gray-600 text-xs">No agents yet</p>
            ) : (
              <motion.div
                variants={gridVariants}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {data.trust_leaderboard.slice(0, 6).map((a, i) => (
                  <motion.div
                    key={a.agent_id}
                    variants={{
                      hidden: { opacity: 0, x: -16 },
                      show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                    }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-gray-600 text-xs w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs truncate">{a.name}</span>
                        <span
                          className={clsx(
                            "text-xs font-mono ml-2",
                            a.trust_score === 100 && "animate-pulse"
                          )}
                          style={{
                            color:
                              a.trust_score >= 70
                                ? "#00ff88"
                                : a.trust_score >= 40
                                ? "#ffaa00"
                                : "#ff3333",
                            textShadow:
                              a.trust_score === 100
                                ? "0 0 8px rgba(0,255,136,0.6)"
                                : undefined,
                          }}
                        >
                          {a.trust_score}
                        </span>
                      </div>
                      <div className="h-1 bg-white/5 rounded mt-1 overflow-hidden">
                        <motion.div
                          className="h-full rounded"
                          initial={{ width: 0 }}
                          animate={{ width: `${a.trust_score}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          style={{
                            background:
                              a.trust_score >= 70
                                ? "#00ff88"
                                : a.trust_score >= 40
                                ? "#ffaa00"
                                : "#ff3333",
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Live Audit Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-xl border border-white/10 bg-[#161616]/80 backdrop-blur-sm p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-semibold">Live Audit Feed</h3>
            <span
              className={clsx(
                "text-xs px-2 py-0.5 rounded",
                loading ? "text-amber animate-pulse" : "text-green bg-green/10"
              )}
            >
              {loading ? "refreshing..." : "● live"}
            </span>
          </div>
          {!data?.audit_feed?.length ? (
            <p className="text-gray-600 text-xs">No audit log entries yet — run S1 to start</p>
          ) : (
            <div className="space-y-1.5">
              <AnimatePresence initial={false}>
                {data.audit_feed.map((e) => (
                  <motion.div
                    key={e.log_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-3 py-1.5 px-2 rounded bg-white/[0.02] border border-white/5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green flex-shrink-0" />
                    <span className="text-gray-400 text-xs font-mono">{e.log_id.slice(0, 8)}</span>
                    <span className="text-white text-xs flex-1">{e.action_type}</span>
                    <span className="text-gray-600 text-xs">
                      {new Date(e.timestamp).toLocaleTimeString("en-IN")}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
