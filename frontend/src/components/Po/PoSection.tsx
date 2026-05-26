import { useState } from "react";

import {

  Network,

  ShieldAlert,

  CheckCircle2,

  XCircle,

  Lock,

  Cpu,
} from "lucide-react";

import { API_BASE } from "../../lib/api";
import { EmbeddedTerminal } from "../Terminal/EmbeddedTerminal";

export default function PoSection() {

  const [loading, setLoading] =
    useState(false);

  const [response, setResponse] =
    useState<any>(null);

  const [requestPayload, setRequestPayload] =
    useState(`{
  "query": "safe financial transfer"
}`);

  const [attackMode, setAttackMode] =
    useState(false);

  const [kyberResult, setKyberResult] =
    useState<any>(null);

  const [bftResult, setBftResult] =
    useState<any>(null);

  const [financeResult, setFinanceResult] =
    useState<any>(null);

  const warriors = [

    "TIGRESS",

    "MONKEY",

    "CRANE",

    "SNAKE",

    "MANTIS",
  ];

  // ======================================================
  // EXECUTE PO REQUEST
  // ======================================================

  async function executePORequest() {

    setLoading(true);

    setResponse(null);

    try {

      const payload = {

        request_id:
          crypto.randomUUID(),

        session_id:
          crypto.randomUUID(),

        agent_id:
          attackMode
            ? "rogue_agent"
            : "finance_agent",

        action:
          attackMode
            ? "prompt_injection_attack"
            : "transfer_funds",

        payload:
          JSON.parse(requestPayload),

        signature:
          "mock_signature",

        jwt_token:
          "mock_jwt_token",
      };

      const res = await fetch(

        `${API_BASE}/po/gateway`,

        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload
          ),
        }
      );

      const data = await res.json();

      setResponse(data);

    } catch (err) {

      console.error(err);
    }

    setLoading(false);
  }

  // ======================================================
  // CREATE BFT REQUEST
  // ======================================================

  async function createBFTRequest() {

    try {

      const res = await fetch(

        `${API_BASE}/po/bft/create`,

        {
          method: "POST",
        }
      );

      const data = await res.json();
      setBftResult(data);

    } catch (err) {

      console.error(err);
      setBftResult({ error: (err as any).message });
    }
  }

  // ======================================================
  // CREATE FINANCE REQUEST
  // ======================================================

  async function createFinanceRequest() {

    try {

      const res = await fetch(

        `${API_BASE}/po/finance/create`,

        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({

            from_account:
              "BANK_A",

            to_account:
              "BANK_B",

            amount:
              500000,

            initiated_by:
              "finance_agent",

            currency:
              "USD",
          }),
        }
      );

      const data = await res.json();
      setFinanceResult(data);

    } catch (err) {

      console.error(err);
      setFinanceResult({ error: (err as any).message });
    }
  }

  // ======================================================
  // KYBER DEMO
  // ======================================================

  async function runKyberDemo() {

    try {

      const res = await fetch(

        `${API_BASE}/po/kyber/demo`
      );

      const data = await res.json();

      console.log(
        "[KYBER DEMO]",
        data
      );

      setKyberResult(data);

    } catch (err) {

      console.error(err);
    }
  }

  return (

    <section className="rounded-3xl border border-cyan-500/20 bg-[#0b1220] p-8 shadow-2xl">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-8 flex items-center gap-4">

        <div className="rounded-2xl bg-cyan-500/10 p-4">

          <Network className="h-8 w-8 text-cyan-400" />

        </div>

        <div>

          <h1 className="text-3xl font-black text-white">

            PO — Dragon Warrior Gateway

          </h1>

          <p className="text-gray-400">

            Central Security Orchestration Engine

          </p>

        </div>

      </div>

      {/* ================================================= */}
      {/* WARRIOR STATUS */}
      {/* ================================================= */}

      <div className="mb-8 grid gap-4 md:grid-cols-5">

        {warriors.map((warrior) => (

          <div
            key={warrior}
            className="rounded-2xl border border-white/10 bg-[#111827] px-5 py-4"
          >

            <div className="flex items-center justify-between">

              <p className="font-bold text-white">

                {warrior}

              </p>

              <CheckCircle2 className="text-green-400" />

            </div>

          </div>
        ))}

      </div>

      {/* ================================================= */}
      {/* CONTROL PANEL */}
      {/* ================================================= */}

      <div className="grid gap-6 xl:grid-cols-2">

        {/* LEFT */}

        <div className="space-y-5">

          {/* REQUEST PAYLOAD */}

          <div>

            <label className="mb-2 block text-sm text-gray-400">

              Request Payload

            </label>

            <textarea
              value={requestPayload}
              onChange={(e) =>
                setRequestPayload(
                  e.target.value
                )
              }
              className="h-[180px] w-full rounded-2xl border border-cyan-500/20 bg-[#111827] p-4 text-sm text-white outline-none"
            />

          </div>

          {/* ATTACK MODE */}

          <div className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">

            <div>

              <div className="font-bold text-red-400">

                Attack Simulation

              </div>

              <div className="text-sm text-gray-400">

                Trigger hostile request path

              </div>

            </div>

            <button
              onClick={() =>
                setAttackMode(
                  !attackMode
                )
              }
              className={`rounded-full px-5 py-2 text-sm font-bold ${
                attackMode
                  ? "bg-red-500 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >

              {attackMode
                ? "ON"
                : "OFF"}

            </button>

          </div>

          {/* EXECUTE */}

          <button
            onClick={executePORequest}
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-500 px-6 py-4 font-bold text-black transition hover:bg-cyan-400"
          >

            {loading
              ? "Executing..."
              : "Execute PO Pipeline"}

          </button>

        </div>

        {/* RIGHT */}

        <div className="space-y-5">

          {/* ACTIONS */}

          <div className="grid gap-4 md:grid-cols-3">

            <button
              onClick={createBFTRequest}
              className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5 text-left transition hover:bg-cyan-500/20"
            >

              <Lock
                className="mb-3 text-cyan-400"
                size={28}
              />

              <div className="font-bold">

                Create BFT

              </div>

            </button>

            <button
              onClick={
                createFinanceRequest
              }
              className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5 text-left transition hover:bg-green-500/20"
            >

              <ShieldAlert
                className="mb-3 text-green-400"
                size={28}
              />

              <div className="font-bold">

                Finance Flow

              </div>

            </button>

            <button
              onClick={runKyberDemo}
              className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-5 text-left transition hover:bg-orange-500/20"
            >

              <Cpu
                className="mb-3 text-orange-400"
                size={28}
              />

              <div className="font-bold">

                Kyber Demo

              </div>

            </button>

          </div>

          {/* BFT RESULT */}

          {bftResult && (
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
              <h4 className="mb-3 font-bold text-cyan-400">BFT Request Result</h4>
              <div className="space-y-2 text-sm text-gray-300">
                {bftResult.error ? (
                  <p className="text-red-400">{bftResult.error}</p>
                ) : (
                  <>
                    <p>BFT ID: {bftResult.bft_id}</p>
                    <p>Consensus Status: {bftResult.consensus_status}</p>
                    <p>Approvals: {bftResult.approvals}/{bftResult.required_approvals}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* FINANCE RESULT */}

          {financeResult && (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
              <h4 className="mb-3 font-bold text-green-400">Finance Flow Result</h4>
              <div className="space-y-2 text-sm text-gray-300">
                {financeResult.error ? (
                  <p className="text-red-400">{financeResult.error}</p>
                ) : (
                  <>
                    <p>Transaction ID: {financeResult.transaction_id}</p>
                    <p>Amount: {financeResult.amount} {financeResult.currency}</p>
                    <p>Risk Score: {financeResult.risk_score}</p>
                    <p>Status: {financeResult.status}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* KYBER RESULT */}

          {kyberResult && (
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
              <h4 className="mb-3 font-bold text-orange-400">Kyber Encryption Result</h4>
              <div className="space-y-2 text-sm text-gray-300">
                {kyberResult.error ? (
                  <p className="text-red-400">{kyberResult.error}</p>
                ) : (
                  <>
                    <p>Algorithm: {kyberResult.algorithm}</p>
                    <p className="break-all">Ciphertext: {kyberResult.ciphertext?.substring(0, 64)}...</p>
                    <p>Status: {kyberResult.status}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* RESPONSE */}

          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">

            <div className="mb-4 flex items-center gap-3">

              {response?.final_status ===
              "DELIVERED" ? (

                <CheckCircle2 className="text-green-400" />

              ) : (

                <XCircle className="text-red-400" />

              )}

              <h3 className="text-xl font-bold">

                Final Verdict

              </h3>

            </div>

            <div className="space-y-3">

              <div className="rounded-xl bg-[#0b1220] p-4">

                <div className="text-sm text-gray-400">

                  Status

                </div>

                <div
                  className={`mt-1 text-lg font-bold ${
                    response?.final_status ===
                    "DELIVERED"

                      ? "text-green-400"

                      : "text-red-400"
                  }`}
                >

                  {response?.final_status ||
                    "Awaiting"}

                </div>

              </div>

              <div className="rounded-xl bg-[#0b1220] p-4">

                <div className="text-sm text-gray-400">

                  Risk Score

                </div>

                <div className="mt-1 text-lg font-bold text-orange-400">

                  {response?.overall_risk_score ||
                    0}

                </div>

              </div>

              <div className="rounded-xl bg-[#0b1220] p-4">

                <div className="text-sm text-gray-400">

                  Failure Reason

                </div>

                <div className="mt-1 text-sm text-red-400">

                  {response?.reason ||
                    "None"}

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* P4 — KYBER ENCRYPTED CHANNELS TERMINAL */}

      <div className="mt-8 rounded-2xl border border-purple-500/20 bg-[#111827] p-6">

        <div className="mb-5 flex items-center gap-3">

          <Lock className="text-purple-400" />

          <h3 className="text-xl font-bold text-purple-400">

            P4 — Kyber Encrypted Channels (Terminal Demo)

          </h3>

        </div>

        <p className="mb-4 text-sm text-gray-400">

          Call the backend Kyber encryption endpoint and display the encrypted ciphertext in terminal format.

        </p>

        <EmbeddedTerminal
          featureId="p4-kyber-channels"
          title="P4 Kyber Encrypted Channels"
          getCommand={() => 'curl.exe -s http://localhost:8000/po/kyber/demo | python -m json.tool'}
          height={240}
        />

      </div>

    </section>
  );
}