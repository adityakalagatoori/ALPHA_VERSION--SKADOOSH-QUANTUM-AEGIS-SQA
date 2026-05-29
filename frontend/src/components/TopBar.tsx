import { useEffect, useState } from "react";
import { ChevronDown, RefreshCw, Menu } from "lucide-react";
import { useAgentStore } from "../store/agentStore";
import { V2, type Agent } from "../api/client";
import clsx from "clsx";
import { InteractiveLogo } from "./InteractiveLogo";

type ServiceStatus = { name: string; ok: boolean };

type TopBarProps = {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
};

export function TopBar({ sidebarOpen = true, onToggleSidebar }: TopBarProps) {
  const { agents, selectedAgentId, setAgents, setSelected } = useAgentStore();
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "Backend", ok: false },
    { name: "Supabase", ok: false },
    { name: "ArmorIQ", ok: false },
  ]);

  const loadAgents = async () => {
    const res = await V2.trustScores();
    if (res.data) {
      const list = (res.data as { agents: Agent[] }).agents || [];
      setAgents(list);
      if (!selectedAgentId && list.length > 0) {
        setSelected(list[0].agent_id);
      }
    }
  };

  const checkServices = async () => {
    const health = await V2.health();
    setServices([
      { name: "Backend", ok: !health.error },
      { name: "Supabase", ok: !health.error },
      { name: "ArmorIQ", ok: !health.error },
    ]);
  };

  useEffect(() => {
    loadAgents();
    checkServices();
    const t = setInterval(() => { loadAgents(); checkServices(); }, 30000);
    return () => clearInterval(t);
  }, []);

  const selected = agents.find((a) => a.agent_id === selectedAgentId);

  return (
    <div className="h-14 border-b border-white/10 bg-[#111111] flex items-center px-4 gap-4 flex-shrink-0">
      {/* Sidebar toggle — visible only when sidebar is closed */}
      {!sidebarOpen && onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
          title="Open sidebar"
        >
          <Menu size={16} />
          <InteractiveLogo size="xs" />
        </button>
      )}

      {/* Agent Selector */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          <span className="text-white font-medium max-w-32 truncate">
            {selected ? selected.name : "Select Agent"}
          </span>
          {selected && (
            <span className="text-gray-500 text-xs">
              [{selected.sector}]
            </span>
          )}
          <ChevronDown size={14} className="text-gray-500" />
        </button>

        {open && (
          <div className="absolute top-full mt-1 left-0 z-50 min-w-64 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden">
            <div className="px-3 py-2 text-xs text-gray-500 border-b border-white/5">
              {agents.length} registered agents
            </div>
            {agents.length === 0 && (
              <div className="px-3 py-4 text-xs text-gray-500 text-center">
                No agents yet — register one in MONKEY
              </div>
            )}
            {agents.map((a) => (
              <button
                key={a.agent_id}
                onClick={() => { setSelected(a.agent_id); setOpen(false); }}
                className={clsx(
                  "w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors",
                  a.agent_id === selectedAgentId && "bg-green/5 border-l-2 border-green"
                )}
              >
                <span className={clsx("w-2 h-2 rounded-full flex-shrink-0",
                  a.blacklisted ? "bg-red" : a.trust_score < 40 ? "bg-amber" : "bg-green"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{a.name}</p>
                  <p className="text-gray-500 text-xs">{a.sector} · trust: {a.trust_score}</p>
                </div>
                {a.blacklisted && <span className="text-xs text-red">BLACKLISTED</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={loadAgents} className="text-gray-600 hover:text-gray-300 transition-colors" title="Refresh agents">
        <RefreshCw size={14} />
      </button>

      <div className="ml-auto flex items-center gap-3">
        {services.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <span className={clsx("w-2 h-2 rounded-full", s.ok ? "bg-green animate-pulse" : "bg-red")} />
            <span className="text-xs text-gray-500">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
