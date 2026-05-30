import { useState } from "react";

import {
  Fingerprint,
  ShieldAlert,
  KeyRound,
  Activity,
} from "lucide-react";

import { revokeAgent } from "../../api/agentApi";
import { triggerDemoAttack } from "../../api/adminApi";
import { API_BASE } from "../../lib/api";
import { EmbeddedTerminal } from "../Terminal/EmbeddedTerminal";

export default function MonkeySection() {

  const [agentName, setAgentName] =
    useState("banking-agent");

  const [sector, setSector] =
    useState("banking");

  const [logs, setLogs] =
    useState<string[]>([]);

  const [registeredAgentId, setRegisteredAgentId] =
    useState<string>("");

  const addLog = (
    message: string
  ) => {

    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev,
    ]);
  };

  // =====================================================
  // ACTIONS
  // =====================================================

  const registerAgent = async () => {
    try {
      addLog("[ ] Registering agent...");

      const payload = {
        name: agentName,
        sector: sector,
        allowed_actions: ["read", "write", "payments"]
      };

      console.log("Sending payload:", payload);

      const response = await fetch("http://127.0.0.1:8000/agents/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response text:", responseText);

      if (!response.ok) {
        addLog(`[ERR] ${response.status} ${response.statusText}`);
        addLog(`Response: ${responseText}`);
        return;
      }

      const data = JSON.parse(responseText);

      setRegisteredAgentId(data.agent_id);
      localStorage.setItem("sqa_agent_id", data.agent_id);
      localStorage.setItem("sqa_agent_token", data.token);

      addLog(`[OK] Agent ID: ${data.agent_id}`);
      addLog(`[OK] Kyber Algorithm: ${data.kyber_algorithm}`);
      addLog(`[OK] Dilithium Algorithm: ${data.dilithium_algorithm}`);
      addLog(`[OK] Token: ${data.token.substring(0, 50)}...`);
    } catch (error: any) {
      addLog(`[ERR] ${error.message}`);
      console.error("Full error:", error);
    }
  };

  const replayAttack = async () => {
    try {
      addLog("Sending request with duplicate nonce...");
      const result = await triggerDemoAttack("replay-attack");
      addLog(`REPLAY BLOCKED — ${result.event_type || "REPLAY_ATTACK_DETECTED"}`);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
  };

  const forgedAttack = async () => {
    try {
      addLog("Sending forged Dilithium signature...");
      const result = await triggerDemoAttack("quantum-key-forge");
      addLog(`FORGED SIGNATURE REJECTED — ${result.event_type || "QUANTUM_FORGE_BLOCKED"}`);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
  };

  const blacklistAgent = async () => {
    if (!registeredAgentId) {
      addLog("Register an agent first");
      return;
    }
    try {
      addLog(`Revoking agent ${registeredAgentId}...`);
      const result = await revokeAgent(registeredAgentId);
      addLog(`BLACKLISTED — ${registeredAgentId}`);
      addLog(JSON.stringify(result).substring(0, 80));
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
  };

  const oogwaySignal = async () => {
    if (!registeredAgentId) {
      addLog("Register an agent first");
      return;
    }
    try {
      addLog("TRIGGERING OOGWAY'S SIGNAL...");
      await fetch(`${API_BASE}/alerts/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: registeredAgentId,
          threat_type: "IDENTITY_THREAT",
          message: "Oogways Signal — identity threat detected from dashboard"
        })
      });
      addLog("TWILIO CALL SENT — check your phone");
      addLog("SMS ALERT SENT — check your phone");
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
  };

  return (

    <section className="rounded-3xl border border-cyan-500/20 bg-[#0b1220] p-8 shadow-2xl">

      {/* HEADER */}

      <div className="mb-8 flex items-center gap-4">

        <div className="rounded-2xl bg-cyan-500/10 p-4">

          <Fingerprint className="h-8 w-8 text-cyan-400" />

        </div>

        <div>

          <h1 className="text-3xl font-black text-white">

            MONKEY — Post Quantum Identity

          </h1>

          <p className="text-gray-400">

            Kyber1024 + ML-DSA-65 Defense Layer

          </p>
        </div>
      </div>

      {/* GRID */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* REGISTRATION */}

        <div className="rounded-2xl border border-cyan-500/20 bg-[#111827] p-6">

          <div className="mb-5 flex items-center gap-3">

            <KeyRound className="text-cyan-400" />

            <h2 className="text-xl font-bold text-cyan-400">

              PQC Registration

            </h2>
          </div>

          <div className="space-y-4">

            <input
              value={agentName}
              onChange={(e) =>
                setAgentName(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              placeholder="Agent Name"
            />

            <select
              value={sector}
              onChange={(e) =>
                setSector(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3"
            >
              <option>banking</option>
              <option>healthcare</option>
              <option>government</option>
              <option>legal</option>
            </select>

            <button
              onClick={registerAgent}
              className="w-full rounded-xl bg-cyan-500 px-5 py-3 font-black text-black"
            >
              REGISTER AGENT
            </button>
          </div>
        </div>

        {/* ATTACKS */}

        <div className="rounded-2xl border border-red-500/20 bg-[#111827] p-6">

          <div className="mb-5 flex items-center gap-3">

            <ShieldAlert className="text-red-400" />

            <h2 className="text-xl font-bold text-red-400">

              Attack Simulation

            </h2>
          </div>

          <div className="space-y-4">

            <button
              onClick={replayAttack}
              className="w-full rounded-xl bg-orange-500 px-5 py-3 font-black"
            >
              REPLAY ATTACK
            </button>

            <button
              onClick={forgedAttack}
              className="w-full rounded-xl bg-red-500 px-5 py-3 font-black"
            >
              FORGED SIGNATURE
            </button>

            <button
              onClick={blacklistAgent}
              className="w-full rounded-xl bg-pink-500 px-5 py-3 font-black"
            >
              BLACKLIST AGENT
            </button>

            <button
              onClick={oogwaySignal}
              className="w-full rounded-xl bg-yellow-500 px-5 py-3 font-black text-black"
            >
              OOGWAY'S SIGNAL
            </button>

            <EmbeddedTerminal
              featureId="m3-signature-gate"
              title="M3 — Dilithium Signature Gate"
              getCommand={() => {
                const id = localStorage.getItem('sqa_agent_id') || 'REGISTER_FIRST';
                const token = localStorage.getItem('sqa_agent_token') || 'REGISTER_FIRST';
                const ts = Math.floor(Date.now() / 1000);
                const nonce = Math.random().toString(36).slice(2, 10);
                return `curl.exe -s -X POST http://localhost:8000/secure-action -H "x-agent-id: ${id}" -H "x-signature: FORGED_DILITHIUM_SIGNATURE_INVALID" -H "x-payload: malicious_payload" -H "x-action: delete" -H "x-token: ${token}" -H "x-nonce: ${nonce}" -H "x-timestamp: ${ts}"`;
              }}
              height={200}
            />

            <EmbeddedTerminal
              featureId="m6-secure-enclave"
              title="M6 — Secure Enclave (Private Key Isolation)"
              getCommand={() => '$env:PYTHONIOENCODING = "utf-8"; python test_monkey_features.py'}
              height={200}
            />
          </div>
        </div>

        {/* LIVE FEED */}

        <div className="rounded-2xl border border-green-500/20 bg-[#111827] p-6">

          <div className="mb-5 flex items-center gap-3">

            <Activity className="text-green-400" />

            <h2 className="text-xl font-bold text-green-400">

              Live Security Feed

            </h2>
          </div>

          <div className="max-h-[300px] space-y-3 overflow-auto">

            {logs.map((log, index) => (

              <div
                key={index}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-300"
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        <FeatureCard
          title="M1"
          subtitle="Kyber1024 Keypairs"
          color="cyan"
        />

        <FeatureCard
          title="M3"
          subtitle="Dilithium Signatures"
          color="green"
        />

        <FeatureCard
          title="M4"
          subtitle="Blacklist Enforcement"
          color="red"
        />

        <FeatureCard
          title="M5"
          subtitle="Replay Protection"
          color="orange"
        />
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  subtitle,
  color,
}: any) {

  const styles: any = {

    cyan:
      "border-cyan-500/20 text-cyan-400",

    green:
      "border-green-500/20 text-green-400",

    red:
      "border-red-500/20 text-red-400",

    orange:
      "border-orange-500/20 text-orange-400",
  };

  return (

    <div className={`rounded-2xl border bg-[#111827] p-5 ${styles[color]}`}>

      <p className="text-sm font-bold">

        {title}

      </p>

      <h2 className="mt-2 text-xl font-black text-white">

        {subtitle}

      </h2>
    </div>
  );
}