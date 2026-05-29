import { create } from "zustand";
import type { Agent } from "../api/client";

type AgentStore = {
  agents: Agent[];
  selectedAgentId: string | null;
  setAgents: (agents: Agent[]) => void;
  setSelected: (id: string) => void;
  selectedAgent: () => Agent | null;
};

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  selectedAgentId: null,
  setAgents: (agents) => set({ agents }),
  setSelected: (id) => set({ selectedAgentId: id }),
  selectedAgent: () => {
    const { agents, selectedAgentId } = get();
    return agents.find((a) => a.agent_id === selectedAgentId) ?? null;
  },
}));
