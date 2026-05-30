import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, BarChart3, Bot, Timer, Link2, ScrollText, Ban, Scale, CheckCircle2, XCircle } from "lucide-react";
import { V2 } from "../api/client";

type CaseFileData = {
  case_id: string;
  generated_at: string;
  agent: {
    agent_id: string;
    name: string;
    sector: string;
    trust_score: number;
    blacklisted: boolean;
    honeypot_isolated: boolean;
    registered_at: string;
    pqc_enrolled: boolean;
  };
  timeline: {
    first_action: string | null;
    last_action: string | null;
    first_anomaly: string | null;
    exposure_window_seconds: number;
  };
  evidence: {
    audit_entries: number;
    total_actions: number;
    blocked_actions: number;
    anomalous_actions: number;
    honeypot_routed: number;
  };
  chain_integrity: {
    status: "INTACT" | "COMPROMISED";
    break_at_log_id: string | null;
    verified_entries: number;
  };
  audit_chain: { log_id: string; action_type: string; timestamp: string; current_hash: string; signed: boolean }[];
  blocked_actions_log: { action_type: string; risk_score: number; block_reason: string; timestamp: string }[];
  compliance: Record<string, { passed: boolean; evidence: string; control: string }>;
  compliance_score: string;
  gemini_summary: string;
};

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="text-xs font-mono px-2 py-0.5 rounded"
      style={{
        background: ok ? "rgba(0,255,136,0.12)" : "rgba(255,51,51,0.12)",
        color: ok ? "#00ff88" : "#ff3333",
        border: `1px solid ${ok ? "rgba(0,255,136,0.3)" : "rgba(255,51,51,0.3)"}`,
      }}
    >
      {label}
    </span>
  );
}

function Section({ title, accent = "#c9a227", children }: { title: React.ReactNode; accent?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border border-white/10 bg-[#161616]/80 p-4 space-y-3"
      style={{ boxShadow: `0 0 0 1px ${accent}18` }}
    >
      <h3 className="text-sm font-semibold font-mono" style={{ color: accent }}>{title}</h3>
      {children}
    </div>
  );
}

export function CaseFile() {
  const [agentId, setAgentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CaseFileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!agentId.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    const res = await (V2 as unknown as { caseFile: (id: string) => Promise<{ data: CaseFileData | null; error: string | null }> }).caseFile(agentId.trim());
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error || "No data returned");
    } else {
      setData(res.data);
    }
  }

  const chainOk = data?.chain_integrity.status === "INTACT";

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-white text-xl font-bold font-mono flex items-center gap-2">
          <FileText size={20} className="text-amber-400 flex-shrink-0" strokeWidth={1.5} />
          <span>SQA Case File</span>
          <span className="text-xs text-gray-600 font-normal ml-2">Forensic Accountability Report</span>
        </h1>
        <p className="text-gray-500 text-xs mt-1">
          Court-ready evidence pack: SNAKE audit chain + MANTIS timeline + ArmorClaw history + Oracle Scroll + Gemini executive summary
        </p>
      </div>

      {/* Agent ID input */}
      <div className="flex gap-3 items-stretch">
        <input
          type="text"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
          placeholder="Enter agent_id to investigate…"
          className="flex-1 bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-mono placeholder-gray-700 focus:outline-none focus:border-amber-500/40"
        />
        <button
          onClick={generate}
          disabled={loading || !agentId.trim()}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold font-mono transition-all disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, #c9a227, #8b6914)",
            color: "#000",
          }}
        >
          {loading ? "Generating…" : <span className="flex items-center gap-1.5"><Scale size={14} strokeWidth={2} /> Generate Case File</span>}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400 text-sm font-mono">
          {error}
        </div>
      )}

      <AnimatePresence>
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Case header */}
            <div
              className="rounded-xl border p-4 flex flex-wrap gap-4 items-start"
              style={{ borderColor: chainOk ? "rgba(0,255,136,0.3)" : "rgba(255,51,51,0.4)", background: chainOk ? "rgba(0,255,136,0.04)" : "rgba(255,51,51,0.04)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-bold font-mono text-base">{data.agent.name}</span>
                  <Badge ok={!data.agent.blacklisted} label={data.agent.blacklisted ? "BLACKLISTED" : "ACTIVE"} />
                  <Badge ok={!data.agent.honeypot_isolated} label={data.agent.honeypot_isolated ? "HONEYPOT" : "FREE"} />
                  <Badge ok={data.agent.pqc_enrolled} label={data.agent.pqc_enrolled ? "PQC ✓" : "NO PQC"} />
                  <Badge ok={chainOk} label={chainOk ? "CHAIN INTACT" : "CHAIN BROKEN"} />
                </div>
                <p className="text-gray-500 text-xs mt-1 font-mono">
                  Case ID: {data.case_id} · Sector: {data.agent.sector} · Trust: {data.agent.trust_score}
                </p>
                <p className="text-gray-600 text-xs mt-0.5 font-mono">
                  Generated: {new Date(data.generated_at).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <div
                  className="text-3xl font-bold font-mono"
                  style={{ color: parseInt(data.compliance_score) >= 3 ? "#00ff88" : "#ff6600" }}
                >
                  {data.compliance_score}
                </div>
                <div className="text-gray-500 text-xs">Compliance</div>
              </div>
            </div>

            {/* Gemini Executive Summary */}
            <Section title={<span className="flex items-center gap-1.5"><Bot size={14} strokeWidth={1.5} /> Gemini Executive Summary</span>} accent="#4488ff">
              <p className="text-gray-300 text-sm leading-relaxed">{data.gemini_summary}</p>
            </Section>

            {/* Evidence stats */}
            <Section title={<span className="flex items-center gap-1.5"><BarChart3 size={14} strokeWidth={1.5} /> Evidence Summary</span>} accent="#00ff88">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: "Audit Entries", value: data.evidence.audit_entries, color: "#00ff88" },
                  { label: "Total Actions", value: data.evidence.total_actions, color: "#4488ff" },
                  { label: "Blocked", value: data.evidence.blocked_actions, color: "#ff3333" },
                  { label: "Anomalous", value: data.evidence.anomalous_actions, color: "#ff6600" },
                  { label: "Honeypot Routed", value: data.evidence.honeypot_routed, color: "#b04020" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-black/30 p-3 text-center">
                    <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-gray-600 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Timeline */}
            <Section title={<span className="flex items-center gap-1.5"><Timer size={14} strokeWidth={1.5} /> Breach Timeline</span>} accent="#c9a227">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                {[
                  { label: "First Action", val: data.timeline.first_action },
                  { label: "First Anomaly", val: data.timeline.first_anomaly },
                  { label: "Last Action", val: data.timeline.last_action },
                  { label: "Exposure Window", val: data.timeline.exposure_window_seconds + "s" },
                ].map((t) => (
                  <div key={t.label} className="rounded bg-black/20 p-2">
                    <div className="text-gray-600 text-[10px] mb-0.5">{t.label}</div>
                    <div className="text-gray-300 break-all">
                      {t.val ? (typeof t.val === "string" && t.val.includes("T") ? new Date(t.val).toLocaleString("en-IN") : t.val) : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Chain Integrity */}
            <Section title={<span className="flex items-center gap-1.5"><Link2 size={14} strokeWidth={1.5} /> Audit Chain Integrity</span>} accent={chainOk ? "#00ff88" : "#ff3333"}>
              <div className="flex items-center gap-3 text-sm">
                {chainOk
                  ? <CheckCircle2 size={24} style={{ color: "#00ff88", flexShrink: 0 }} strokeWidth={1.5} />
                  : <XCircle size={24} style={{ color: "#ff3333", flexShrink: 0 }} strokeWidth={1.5} />
                }
                <div>
                  <div className="font-mono font-bold" style={{ color: chainOk ? "#00ff88" : "#ff3333" }}>
                    {data.chain_integrity.status}
                  </div>
                  <div className="text-gray-500 text-xs">{data.chain_integrity.verified_entries} entries verified</div>
                  {data.chain_integrity.break_at_log_id && (
                    <div className="text-red-400 text-xs">Break detected at log: {data.chain_integrity.break_at_log_id}</div>
                  )}
                </div>
              </div>
              {data.audit_chain.length > 0 && (
                <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                  {data.audit_chain.map((e) => (
                    <div key={e.log_id} className="flex items-center gap-2 text-xs font-mono py-0.5 px-2 rounded bg-black/20">
                      <span style={{ color: e.signed ? "#00ff88" : "#ff6600" }}>{e.signed ? "✓" : "~"}</span>
                      <span className="text-gray-600">{e.log_id.slice(0, 8)}</span>
                      <span className="text-gray-400 flex-1 truncate">{e.action_type}</span>
                      <span className="text-gray-700">{e.current_hash}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Compliance */}
            <Section title={<span className="flex items-center gap-1.5"><ScrollText size={14} strokeWidth={1.5} /> Compliance Status</span>} accent="#a78bfa">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(data.compliance).map(([framework, detail]) => (
                  <div
                    key={framework}
                    className="rounded-lg p-3 border"
                    style={{
                      borderColor: detail.passed ? "rgba(0,255,136,0.2)" : "rgba(255,51,51,0.2)",
                      background: detail.passed ? "rgba(0,255,136,0.03)" : "rgba(255,51,51,0.03)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-white">{framework.replace("_", " ")}</span>
                      <Badge ok={detail.passed} label={detail.passed ? "PASS" : "FAIL"} />
                    </div>
                    <div className="text-gray-500 text-xs">{detail.control}</div>
                    <div className="text-gray-400 text-xs mt-1">{detail.evidence}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Blocked actions */}
            {data.blocked_actions_log.length > 0 && (
              <Section title={<span className="flex items-center gap-1.5"><Ban size={14} strokeWidth={1.5} /> Blocked Actions Log</span>} accent="#ff3333">
                <div className="space-y-1">
                  {data.blocked_actions_log.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs font-mono py-1 px-2 rounded bg-black/20">
                      <span className="text-red-400 font-bold">{a.risk_score}</span>
                      <span className="text-white flex-1 truncate">{a.action_type}</span>
                      <span className="text-gray-600 truncate max-w-[180px]">{a.block_reason}</span>
                      <span className="text-gray-700">{new Date(a.timestamp).toLocaleTimeString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!data && !loading && !error && (
        <div className="text-center py-16 text-gray-700 font-mono text-sm">
          Enter an agent ID to generate a forensic case file
        </div>
      )}
    </div>
  );
}
