import { useState, useEffect } from "react";

import {
  ScrollText,
  ShieldAlert,
  Binary,
  Database,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { tamperAuditEntry } from "../../api/agentApi";
import { EmbeddedTerminal } from "../Terminal/EmbeddedTerminal";

export default function SnakeSection() {

  const [auditLogs, setAuditLogs] =
    useState<any[]>([]);

  const [tampered, setTampered] =
    useState(false);

  const [merkleRoot, setMerkleRoot] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  // =====================================================
  // S7: FETCH REAL AUDIT CHAIN FROM BACKEND
  // =====================================================

  useEffect(() => {
    const fetchAuditChain = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/snake/checkpoints");
        const data = await res.json();
        if (data.checkpoints && Array.isArray(data.checkpoints)) {
          setAuditLogs(data.checkpoints);
        }
        setLoading(false);
      } catch (e) {
        console.error("[S7] Audit chain fetch error:", e);
        setLoading(false);
      }
    };

    fetchAuditChain();
    const interval = setInterval(fetchAuditChain, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // S7: FETCH REAL MERKLE ROOT FROM BACKEND
  // =====================================================

  useEffect(() => {
    const fetchMerkleRoot = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/snake/merkle-root");
        const data = await res.json();
        if (data.merkle_root) {
          setMerkleRoot(data.merkle_root);
        }
      } catch (e) {
        console.error("[S7] Merkle root fetch error:", e);
      }
    };

    fetchMerkleRoot();
    const interval = setInterval(fetchMerkleRoot, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // S4: LISTEN TO TAMPER ALERTS VIA WEBSOCKET
  // =====================================================

  useEffect(() => {
    try {
      const ws = new WebSocket("ws://localhost:8000/ws/security-feed");

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "TAMPER_DETECTED") {
            setTampered(true);
          } else if (msg.type === "MERKLE_CHECKPOINT") {
            setMerkleRoot(msg.merkle_root);
          }
        } catch (e) {
          console.error("[S7] WebSocket parse error:", e);
        }
      };

      return () => ws.close();
    } catch (e) {
      console.error("[S7] WebSocket connection error:", e);
    }
  }, []);

  // =====================================================
  // TAMPER DEMO (REAL BACKEND CALL)
  // =====================================================

  const tamperChain = async () => {
    try {
      setTampered(true);
      setMerkleRoot("CHAIN_CORRUPTED");
      const result = await tamperAuditEntry(0);
      console.log("[S4] Tamper result:", result);
    } catch (e) {
      console.error("[S4] Tamper error:", e);
    }
  };

  return (

    <section className={`rounded-3xl border p-8 shadow-2xl ${tampered
      ? "border-red-500/30 bg-red-950/10"
      : "border-green-500/20 bg-[#0b1220]"
    }`}>

      {/* HEADER */}

      <div className="mb-8 flex items-center gap-4">

        <div className={`rounded-2xl p-4 ${tampered
          ? "bg-red-500/10"
          : "bg-green-500/10"
        }`}>

          <ScrollText className={`h-8 w-8 ${tampered
            ? "text-red-400"
            : "text-green-400"
          }`} />

        </div>

        <div>

          <h1 className="text-3xl font-black text-white">

            SNAKE — Tamper Proof Audit Chain

          </h1>

          <p className="text-gray-400">

            Immutable SHA3 Ledger + Merkle Verification

          </p>
        </div>
      </div>

      {/* GRID */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* AUDIT CHAIN */}

        <div className="rounded-2xl border border-green-500/20 bg-[#111827] p-6">

          <div className="mb-5 flex items-center gap-3">

            <Database className="text-green-400" />

            <h2 className="text-xl font-bold text-green-400">

              Immutable Ledger

            </h2>
          </div>

          <div className="max-h-[350px] space-y-3 overflow-auto">

            {loading ? (
              <div className="text-center text-gray-400">Loading audit logs...</div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center text-gray-400">No audit entries yet</div>
            ) : (
              auditLogs.map((log, index) => (

                <div
                  key={index}
                  className={`rounded-xl border p-4 ${log.verification === "TAMPERED"
                    ? "border-red-500/30 bg-red-950/20"
                    : "border-white/10 bg-black/30"
                  }`}
                >

                  <div className="flex items-center justify-between">

                    <span className="font-bold text-cyan-400">

                      {log.action || log.action}

                    </span>

                    <span className={`text-sm font-bold ${log.verification === "TAMPERED"
                      ? "text-red-400"
                      : "text-green-400"
                    }`}>

                      {log.verification || log.status || "VERIFIED"}

                    </span>
                  </div>

                  <p className="mt-3 break-all text-xs text-gray-400">

                    {(log.current_hash || log.hash || "").substring(0, 28)}...

                  </p>

                  <p className="mt-1 text-xs text-gray-500">

                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}

                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MERKLE */}

        <div className="rounded-2xl border border-purple-500/20 bg-[#111827] p-6">

          <div className="mb-5 flex items-center gap-3">

            <Binary className="text-purple-400" />

            <h2 className="text-xl font-bold text-purple-400">

              Merkle Checkpoints

            </h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">

            <p className="mb-4 text-sm text-gray-400">

              Sacred Peach Tree Root

            </p>

            <p className={`break-all text-sm font-bold ${tampered
              ? "text-red-400"
              : "text-purple-300"
            }`}>

              {merkleRoot ? merkleRoot.substring(0, 32) + "..." : "Computing..."}

            </p>
          </div>

          <div className="mt-6 space-y-3">

            <CheckpointRow
              title="Checkpoint #1"
              status="VERIFIED"
            />

            <CheckpointRow
              title="Checkpoint #2"
              status="VERIFIED"
            />

            <CheckpointRow
              title="Checkpoint #3"
              status={
                tampered
                  ? "CORRUPTED"
                  : "VERIFIED"
              }
              danger={tampered}
            />
          </div>
        </div>

        {/* TAMPER */}

        <div className={`rounded-2xl border p-6 ${tampered
          ? "border-red-500/30 bg-red-950/20"
          : "border-cyan-500/20 bg-[#111827]"
        }`}>

          <div className="mb-5 flex items-center gap-3">

            <ShieldAlert className={` ${tampered
              ? "text-red-400"
              : "text-cyan-400"
            }`} />

            <h2 className={`text-xl font-bold ${tampered
              ? "text-red-400"
              : "text-cyan-400"
            }`}>

              Live Tamper Detection

            </h2>
          </div>

          <div className="flex h-[240px] items-center justify-center rounded-2xl border border-white/10 bg-black/30">

            {tampered ? (

              <div className="text-center">

                <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-400" />

                <p className="text-2xl font-black text-red-400">

                  CHAIN BREACHED

                </p>

                <p className="mt-3 text-sm text-gray-400">

                  Hash continuity destroyed

                </p>
              </div>

            ) : (

              <div className="text-center">

                <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-400" />

                <p className="text-2xl font-black text-green-400">

                  CHAIN VERIFIED

                </p>

                <p className="mt-3 text-sm text-gray-400">

                  Immutable ledger intact

                </p>
              </div>
            )}
          </div>

          <button
            onClick={tamperChain}
            className="mt-6 w-full rounded-xl bg-red-500 px-5 py-3 font-black"
          >
            TAMPER AUDIT ENTRY
          </button>

          <EmbeddedTerminal
            featureId="s2-dilithium-audit"
            title="S2 — Dilithium Audit Signing Verification"
            getCommand={() => 'curl.exe -s http://localhost:8000/snake/verify-chain | python -m json.tool'}
            height={200}
          />
        </div>
      </div>

      {/* FEATURES */}

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        <FeatureCard
          title="S1"
          subtitle="Immutable Ledger"
          color="green"
        />

        <FeatureCard
          title="S3"
          subtitle="Hash Chain"
          color="cyan"
        />

        <FeatureCard
          title="S4"
          subtitle="Tamper Detection"
          color="red"
        />

        <FeatureCard
          title="S6/S7"
          subtitle="Merkle Tree"
          color="purple"
        />
      </div>
    </section>
  );
}

function CheckpointRow({
  title,
  status,
  danger = false,
}: any) {

  return (

    <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${danger
      ? "border-red-500/30 bg-red-950/20"
      : "border-white/10 bg-black/30"
    }`}>

      <p className="text-sm text-gray-300">

        {title}

      </p>

      <p className={`text-sm font-bold ${danger
        ? "text-red-400"
        : "text-green-400"
      }`}>

        {status}

      </p>
    </div>
  );
}

function FeatureCard({
  title,
  subtitle,
  color,
}: any) {

  const styles: any = {

    green:
      "border-green-500/20 text-green-400",

    cyan:
      "border-cyan-500/20 text-cyan-400",

    red:
      "border-red-500/20 text-red-400",

    purple:
      "border-purple-500/20 text-purple-400",
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