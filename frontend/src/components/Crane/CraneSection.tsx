import { useState, useEffect } from "react";

import {
  Lock,
  ShieldCheck,
  Scale,
  Clock3,
  KeySquare,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { verifyToken, simulateExpiry, startMultiSigAction, generateTribunal } from "../../api/agentApi";
import { EmbeddedTerminal } from "../Terminal/EmbeddedTerminal";

export default function CraneSection() {

  const [logs, setLogs] =
    useState<string[]>([]);

  const [selectedAction, setSelectedAction] =
    useState("read");

  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const t = localStorage.getItem("sqa_agent_token") || "";
    setToken(t);
  }, []);

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

  const verifyCapability = async () => {
    if (!token) {
      addLog("Register an agent in MONKEY section first");
      return;
    }
    try {
      addLog(`Verifying token for action: ${selectedAction}`);
      const result = await verifyToken(token);
      addLog(`VALID — agent: ${result.payload?.agent_id}`);
      addLog(`Allowed actions: ${result.payload?.allowed_actions?.join(", ")}`);
    } catch (e: any) {
      addLog(`INVALID TOKEN — ${e.message}`);
    }
  };

  const startMultisig = async () => {
    if (!token) {
      addLog("Register an agent in MONKEY section first");
      return;
    }
    try {
      addLog(`Starting multisig for action: ${selectedAction}`);
      const result = await startMultiSigAction(token, selectedAction, 5000);
      addLog(`Task ID: ${result.task_id || result.request_id}`);
      addLog(`Status: ${result.execution_status || result.status}`);
      addLog(`Approvals: ${result.current_approvals}/${result.required_approvals}`);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
  };

  const tribunalDemo = async () => {
    if (!token) {
      addLog("Register an agent in MONKEY section first");
      return;
    }
    try {
      addLog(`Attempting out-of-scope action: ${selectedAction}`);
      const result = await generateTribunal(token, selectedAction);
      addLog(`TRIBUNAL GENERATED — Decision: ${result.tribunal?.decision || "BLOCKED"}`);
      addLog(`Reason: ${result.tribunal?.reason || "OUT_OF_SCOPE_ACTION"}`);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
  };

  const expiryDemo = async () => {
    if (!token) {
      addLog("Register an agent in MONKEY section first");
      return;
    }
    addLog("Starting token expiry simulation (10s wait)...");
    try {
      const result = await simulateExpiry(token);
      addLog(`Expiry result: ${result.status}`);
    } catch (e: any) {
      addLog(`TOKEN EXPIRED — ${e.message}`);
    }
  };

  return (

    <section className="rounded-3xl border border-yellow-500/20 bg-[#0b1220] p-8 shadow-2xl">

      {/* HEADER */}

      <div className="mb-8 flex items-center gap-4">

        <div className="rounded-2xl bg-yellow-500/10 p-4">

          <Lock className="h-8 w-8 text-yellow-400" />

        </div>

        <div>

          <h1 className="text-3xl font-black text-white">

            CRANE — Capability Enforcement

          </h1>

          <p className="text-gray-400">

            Scoped JWT Execution + Tribunal Logic

          </p>
        </div>
      </div>

      {/* MAIN GRID */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* CAPABILITY */}

        <div className="rounded-2xl border border-cyan-500/20 bg-[#111827] p-6">

          <div className="mb-5 flex items-center gap-3">

            <KeySquare className="text-cyan-400" />

            <h2 className="text-xl font-bold text-cyan-400">

              Capability Tokens

            </h2>
          </div>

          <div className="space-y-4">

            <select
              value={selectedAction}
              onChange={(e) =>
                setSelectedAction(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3"
            >
              <option>read</option>
              <option>write</option>
              <option>delete</option>
              <option>finance</option>
            </select>

            <button
              onClick={verifyCapability}
              className="w-full rounded-xl bg-cyan-500 px-5 py-3 font-black text-black"
            >
              VERIFY CAPABILITY
            </button>

            <button
              onClick={expiryDemo}
              className="w-full rounded-xl bg-orange-500 px-5 py-3 font-black"
            >
              TOKEN EXPIRY DEMO
            </button>

            <EmbeddedTerminal
              featureId="c5-token-expiry"
              title="C5/C6 — Token Expiry & Checkpoint Validation"
              getCommand={() => {
                const token = localStorage.getItem('sqa_agent_token') || 'REGISTER_FIRST';
                return `curl.exe -s -X POST http://localhost:8000/simulate-expiry -H "Content-Type: application/json" -d '{"token":"${token}"}'`;
              }}
              height={200}
            />
          </div>
        </div>

        {/* MULTISIG */}

        <div className="rounded-2xl border border-purple-500/20 bg-[#111827] p-6">

          <div className="mb-5 flex items-center gap-3">

            <ShieldCheck className="text-purple-400" />

            <h2 className="text-xl font-bold text-purple-400">

              MultiSig Approval

            </h2>
          </div>

          <div className="space-y-4">

            <button
              onClick={startMultisig}
              className="w-full rounded-xl bg-purple-500 px-5 py-3 font-black"
            >
              START MULTISIG
            </button>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">

              <p className="text-sm text-gray-400">

                Required Signatures

              </p>

              <div className="mt-3 flex items-center gap-3">

                <CheckCircle2 className="text-green-400" />

                <CheckCircle2 className="text-green-400" />

                <AlertTriangle className="text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* TRIBUNAL */}

        <div className="rounded-2xl border border-red-500/20 bg-[#111827] p-6">

          <div className="mb-5 flex items-center gap-3">

            <Scale className="text-red-400" />

            <h2 className="text-xl font-bold text-red-400">

              Jade Palace Tribunal

            </h2>
          </div>

          <div className="space-y-4">

            <button
              onClick={tribunalDemo}
              className="w-full rounded-xl bg-red-500 px-5 py-3 font-black"
            >
              GENERATE TRIBUNAL
            </button>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">

              <div className="mb-3 flex items-center justify-between">

                <p className="text-sm text-gray-400">

                  Explainability Score

                </p>

                <p className="font-bold text-red-400">

                  BLOCKED

                </p>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/10">

                <div className="h-full w-[85%] bg-red-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE FEED */}

      <div className="mt-8 rounded-2xl border border-white/10 bg-[#111827] p-6">

        <div className="mb-5 flex items-center gap-3">

          <Clock3 className="text-yellow-400" />

          <h2 className="text-xl font-bold text-yellow-400">

            Execution Feed

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

      {/* FEATURES */}

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        <FeatureCard
          title="C1"
          subtitle="JWT Capability Tokens"
          color="cyan"
        />

        <FeatureCard
          title="C3"
          subtitle="MultiSig Approval"
          color="purple"
        />

        <FeatureCard
          title="C5"
          subtitle="Execution Checkpoints"
          color="yellow"
        />

        <FeatureCard
          title="C7"
          subtitle="Jade Palace Tribunal"
          color="red"
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

    purple:
      "border-purple-500/20 text-purple-400",

    yellow:
      "border-yellow-500/20 text-yellow-400",

    red:
      "border-red-500/20 text-red-400",
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