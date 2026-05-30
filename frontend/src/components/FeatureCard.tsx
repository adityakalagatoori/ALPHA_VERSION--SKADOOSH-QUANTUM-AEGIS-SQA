import React, { useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Database, Shield, Zap } from "lucide-react";
import clsx from "clsx";
import { RippleButton } from "./ui/multi-type-ripple-buttons";

export type ProofChip = {
  label: string;
  table?: string;
  row?: unknown;
  response?: unknown;
  type: "supabase" | "armoriq" | "armorclaw" | "gemini";
};

type Props = {
  id: string;
  title: string;
  description: string;
  accent?: string;
  children?: ReactNode;
  onRun?: () => Promise<unknown>;
  running?: boolean;
  result?: unknown;
  error?: string | null;
  proofs?: ProofChip[];
  autoRun?: boolean;
  badge?: string;
};

function ProofPanel({ chip }: { chip: ProofChip }) {
  const [open, setOpen] = useState(false);
  const icons: Record<string, React.ReactNode> = {
    supabase: <Database size={12} />,
    armoriq: <Shield size={12} />,
    armorclaw: <Zap size={12} />,
    gemini: <Zap size={12} />,
  };
  const colors = {
    supabase: "bg-green/10 text-green border-green/30",
    armoriq: "bg-blue/10 text-blue border-blue/30",
    armorclaw: "bg-orange/10 text-orange border-orange/30",
    gemini: "bg-teal/10 text-teal border-teal/30",
  };
  const data = chip.row || chip.response;

  return (
    <div className="inline-block">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex items-center gap-1 px-2 py-1 rounded text-xs border cursor-pointer hover:opacity-80 transition-opacity",
          colors[chip.type]
        )}
      >
        {icons[chip.type]}
        {chip.label}
        {!!data && (open ? <ChevronDown size={10} /> : <ChevronRight size={10} />)}
      </motion.button>
      <AnimatePresence>
        {open && !!data && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 p-2 bg-black/60 border border-white/10 rounded text-xs font-mono text-gray-300 max-h-40 overflow-auto whitespace-pre-wrap"
          >
            {JSON.stringify(data, null, 2)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultBox({ result, error }: { result: unknown; error?: string | null }) {
  const [collapsed, setCollapsed] = useState(false);
  if (!result && !error) return null;

  if (error) {
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(error);
    } catch {
      parsed = null;
    }
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 rounded-lg border border-red/30 bg-red/5 p-3"
      >
        <p className="text-red text-xs font-bold mb-1">ERROR</p>
        <pre className="text-red/80 text-xs font-mono whitespace-pre-wrap break-all max-h-40 overflow-auto">
          {parsed ? JSON.stringify(parsed, null, 2) : error}
        </pre>
      </motion.div>
    );
  }

  const obj = result as Record<string, unknown>;
  const humanMsg =
    obj?.message || obj?.status || obj?.verdict_message || obj?.verdict || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-lg border border-green/20 bg-green/5"
    >
      {humanMsg && (
        <div className="px-3 pt-3 pb-1">
          <p className="text-green text-sm font-mono">{String(humanMsg)}</p>
        </div>
      )}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center gap-1 px-3 py-1 text-xs text-gray-500 hover:text-gray-300"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        {collapsed ? "Show" : "Hide"} JSON response
      </button>
      {!collapsed && (
        <pre className="px-3 pb-3 text-xs font-mono text-gray-300 whitespace-pre-wrap break-all max-h-48 overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </motion.div>
  );
}

export function FeatureCard({
  id,
  title,
  description,
  accent = "#00ff88",
  children,
  onRun,
  running = false,
  result,
  error,
  proofs = [],
  badge,
}: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#161616] overflow-hidden" data-feature-id={id}>
      <div className="px-4 py-3 flex items-start gap-3 border-b border-white/5">
        <span
          className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold font-mono"
          style={{ background: accent + "22", color: accent, border: `1px solid ${accent}44` }}
        >
          {id}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white text-sm font-semibold truncate">{title}</h3>
            {badge && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{badge}</span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-0.5 truncate">{description}</p>
        </div>
      </div>

      <div className="p-4">
        {children}

        {onRun && (
          <motion.div
            className="mt-3"
            whileHover={{ scale: running ? 1 : 1.02 }}
            whileTap={{ scale: running ? 1 : 0.98 }}
          >
            <RippleButton
              variant="default"
              onClick={onRun}
              disabled={running}
              className="w-full py-2 px-4 rounded-lg font-mono text-sm font-bold"
              style={{
                background: running ? "#333" : accent + "22",
                color: running ? "#888" : accent,
                border: `1px solid ${accent}44`,
              }}
            >
              {running ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⟳</span> Running...
                </span>
              ) : (
                "[ RUN ]"
              )}
            </RippleButton>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {(result || error) && (
            <ResultBox result={result} error={error} />
          )}
        </AnimatePresence>

        {proofs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {proofs.map((p, i) => (
              <ProofPanel key={i} chip={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Utility hook for feature cards
export function useFeature() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proofs, setProofs] = useState<ProofChip[]>([]);

  const run = async (fn: () => Promise<{ data: unknown; error: string | null; raw: unknown }>) => {
    setRunning(true);
    setError(null);
    setResult(null);
    setProofs([]);
    const res = await fn();
    setRunning(false);
    if (res.error) {
      setError(res.error);
      return null;
    }
    setResult(res.data as Record<string, unknown>);

    // Auto-extract proof chips from response
    const d = res.data as Record<string, unknown>;
    if (d) {
      const chips: ProofChip[] = [];
      if (d.supabase_table) {
        chips.push({
          type: "supabase",
          label: `SUPABASE: ${d.supabase_table}`,
          table: d.supabase_table as string,
          row: d.supabase_row || d,
        });
      }
      if (d.armoriq || d.armoriq_response) {
        chips.push({
          type: "armoriq",
          label: "ARMORIQ",
          response: d.armoriq || d.armoriq_response,
        });
      }
      if (d.armoriq_policy) {
        chips.push({
          type: "armoriq",
          label: `POLICY: ${(d.armoriq_policy as { policy_name?: string }).policy_name || "ArmorIQ"}`,
          response: d.armoriq_policy,
        });
      }
      if (d.armorclaw_response || d.armorclaw) {
        chips.push({
          type: "armorclaw",
          label: "ARMORCLAW",
          response: d.armorclaw_response || d.armorclaw,
        });
      }
      setProofs(chips);
    }
    return res.data;
  };

  return { running, result, error, proofs, run };
}
