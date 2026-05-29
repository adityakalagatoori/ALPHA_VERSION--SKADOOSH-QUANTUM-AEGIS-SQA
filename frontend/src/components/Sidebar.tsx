import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import clsx from "clsx";
import { InteractiveLogo } from "./InteractiveLogo";

export type Section = {
  id: string;
  emoji: string;
  image?: string;
  label: string;
  count: number;
  accent: string;
};

export const SECTIONS: Section[] = [
  { id: "overview",  emoji: "🏠",  image: "/overview.png",  label: "Overview",                count: 0,  accent: "#ffffff" },
  { id: "monkey",    emoji: "🐒",  image: "/monkey.png",    label: "MONKEY — Identity",       count: 7,  accent: "#ffd700" },
  { id: "crane",     emoji: "🦢",  image: "/crane.png",     label: "CRANE — Capability",      count: 7,  accent: "#4488ff" },
  { id: "snake",     emoji: "🐍",  image: "/snake.png",     label: "SNAKE — Audit Chain",     count: 7,  accent: "#00ff88" },
  { id: "mantis",    emoji: "🦗",  image: "/mantis.png",    label: "MANTIS — AI Anomaly",     count: 9,  accent: "#00ccaa" },
  { id: "tigress",   emoji: "🐯",  image: "/tigress.png",   label: "TIGRESS — Prompt Defense",count: 6,  accent: "#ff6600" },
  { id: "po",        emoji: "🐼",  image: "/po.png",        label: "PO — Gateway",            count: 11, accent: "#ffffff" },
  { id: "mirror",    emoji: "⚔️",                           label: "Mirror Test",             count: 11, accent: "#ff3333" },
  { id: "honeypot",  emoji: "🔒",  image: "/tailung.png",   label: "Tai Lung's Cage",         count: 0,  accent: "#b04020" },
  { id: "casefile",  emoji: "📋",  image: "/scroll.png",    label: "SQA Case File",           count: 0,  accent: "#a78bfa" },
];

type Props = {
  active: string;
  open: boolean;
  onSelect: (id: string) => void;
  onToggle: () => void;
};

const SIDEBAR_W = 272;

function SectionIcon({ s, active }: { s: Section; active: boolean }) {
  if (s.image) {
    return (
      <span
        className="flex-shrink-0 flex items-center justify-center"
        style={{ width: 38, height: 38 }}
      >
        <img
          src={s.image}
          alt={s.id}
          style={{
            maxWidth: 38,
            maxHeight: 38,
            width: "auto",
            height: "auto",
            objectFit: "contain",
            filter: active
              ? `drop-shadow(0 0 5px ${s.accent}99)`
              : "brightness(0.72) saturate(0.9)",
            transition: "filter 0.2s",
          }}
        />
      </span>
    );
  }
  return <span className="text-base leading-none flex-shrink-0">{s.emoji}</span>;
}

export function Sidebar({ active, open, onSelect, onToggle }: Props) {
  return (
    <>
      {/* ── Collapsed toggle tab ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="toggle-tab"
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={onToggle}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center gap-3 py-4 px-2 bg-[#111] border border-white/10 border-l-0 rounded-r-xl shadow-xl hover:bg-white/10 transition-colors group"
          >
            <InteractiveLogo size="xs" />
            <ChevronRight size={14} className="text-gray-400 group-hover:text-white transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Sidebar panel ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="sidebar"
            initial={{ x: -SIDEBAR_W, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -SIDEBAR_W, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex-shrink-0 h-full bg-[#0d0d0d] border-r border-white/10 flex flex-col overflow-hidden relative z-40"
            style={{ width: SIDEBAR_W }}
          >
            {/* Logo header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <InteractiveLogo size="sm" />
                <div className="min-w-0">
                  <div className="text-amber-400 font-bold text-sm font-mono leading-tight">SQA</div>
                  <div className="text-gray-600 text-[10px] font-mono">SKADOOSH QUANTUM AEGIS</div>
                  <div className="text-gray-700 text-[10px]">Post-Quantum AI Gateway</div>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded hover:bg-white/5 flex-shrink-0"
                title="Collapse sidebar"
              >
                <ChevronLeft size={14} />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 py-1 overflow-y-auto">
              {SECTIONS.map((s) => {
                const isActive = active === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelect(s.id)}
                    className={clsx(
                      "w-full text-left px-3 py-2 flex items-center gap-3 transition-all relative",
                      isActive
                        ? "bg-white/5"
                        : "hover:bg-white/[0.03] text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
                        style={{ background: s.accent }}
                      />
                    )}
                    <SectionIcon s={s} active={isActive} />
                    <span
                      className={clsx("text-xs font-medium flex-1 truncate", isActive && "font-semibold")}
                      style={isActive ? { color: s.accent } : {}}
                    >
                      {s.label}
                    </span>
                    {s.count > 0 && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0"
                        style={
                          isActive
                            ? { background: s.accent + "22", color: s.accent }
                            : { background: "#222", color: "#555" }
                        }
                      >
                        {s.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="px-3 py-3 border-t border-white/10">
              <p className="text-gray-700 text-xs font-mono">Team Launder Lens</p>
              <p className="text-gray-700 text-xs">Amrita VV · Skadoosh</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
