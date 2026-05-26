import {
  Activity,
  AlertTriangle,
  Brain,
  ShieldAlert,
  Radar,
  Bug,
} from "lucide-react";

import { useEffect, useState } from "react";
import { API_BASE } from "../../lib/api";

interface ActionResult {
  score: number;
  alert: boolean;
  honeypot: boolean;
  status: string;
}

interface OraclePrediction {
  prediction: string;
  source_endpoint: string;
  timestamp: string;
}

interface HoneypotEvent {
  agent_id: string;
  score: number;
  endpoint: string;
  timestamp: string;
  status: string;
}

export default function MantisSection() {
  const [baselineProgress, setBaselineProgress] =
    useState<number>(0);

  const [score, setScore] =
    useState<number>(0);

  const [status, setStatus] =
    useState<string>("NORMAL");

  const [honeypot, setHoneypot] =
    useState<boolean>(false);

  const [oraclePredictions, setOraclePredictions] =
    useState<OraclePrediction[]>([]);

  const [honeypotEvents, setHoneypotEvents] =
    useState<HoneypotEvent[]>([]);

  // =====================================================
  // REGISTER AGENT
  // =====================================================

  useEffect(() => {
    registerAgent();
  }, []);

  async function registerAgent() {
    try {
      await fetch(
        `${API_BASE}/mantis/register-agent`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            agent_id: "mantis-demo-agent",
            sector: "banking",
            capabilities: [
              "read",
              "payments",
            ],
          }),
        }
      );
    } catch (err) {
      console.error(err);
    }
  }

  // =====================================================
  // ACTION SIMULATION
  // =====================================================

  async function simulateAction(
    anomaly = false
  ) {
    try {
      const payloadSize = anomaly
        ? 9000
        : Math.floor(
            Math.random() * 1000
          ) + 500;

      const endpoint = anomaly
        ? "/vault/keys"
        : "/payments/process";

      const response = await fetch(
        `${API_BASE}/mantis/action`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            agent_id:
              "mantis-demo-agent",

            action:
              "PAYMENT_EXECUTION",

            endpoint,

            payload_size:
              payloadSize,

            response_time:
              anomaly
                ? 6.5
                : 0.8,

            metadata: {},
          }),
        }
      );

      const data: ActionResult =
        await response.json();

      setScore(data.score);

      setStatus(data.status);

      setHoneypot(data.honeypot);

      setBaselineProgress(
        (prev) =>
          prev < 50
            ? prev + 1
            : prev
      );

      fetchOracle();

      fetchHoneypot();
    } catch (err) {
      console.error(err);
    }
  }

  // =====================================================
  // FETCH ORACLE
  // =====================================================

  async function fetchOracle() {
    const response = await fetch(
      `${API_BASE}/mantis/oracle`
    );

    const data = await response.json();

    setOraclePredictions(
      data.predictions || []
    );
  }

  // =====================================================
  // FETCH HONEYPOT
  // =====================================================

  async function fetchHoneypot() {
    const response = await fetch(
      `${API_BASE}/mantis/honeypot`
    );

    const data = await response.json();

    setHoneypotEvents(
      data.events || []
    );
  }

  return (
    <div className="space-y-6">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="rounded-2xl border border-emerald-500/20 bg-black/40 p-6 backdrop-blur">

        <div className="flex items-center gap-3">

          <Radar className="h-8 w-8 text-emerald-400" />

          <div>

            <h1 className="text-3xl font-black text-white">
              MANTIS
            </h1>

            <p className="text-gray-400">
              Gemini AI Behavioral
              Anomaly Detection
            </p>

          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* LIVE STATS */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

        <Card
          title="Baseline Progress"
          value={`${baselineProgress}/50`}
          icon={
            <Brain className="h-8 w-8 text-cyan-400" />
          }
        />

        <Card
          title="Risk Score"
          value={score}
          icon={
            <Activity className="h-8 w-8 text-yellow-400" />
          }
        />

        <Card
          title="System Status"
          value={status}
          icon={
            <AlertTriangle className="h-8 w-8 text-red-400" />
          }
        />

        <Card
          title="Honeypot"
          value={
            honeypot
              ? "ROUTED"
              : "SAFE"
          }
          icon={
            <ShieldAlert className="h-8 w-8 text-pink-400" />
          }
        />

      </div>

      {/* ================================================= */}
      {/* ACTIONS */}
      {/* ================================================= */}

      <div className="flex flex-wrap gap-4">

        <button
          onClick={() =>
            simulateAction(false)
          }
          className="rounded-xl bg-emerald-500 px-5 py-3 font-bold text-black transition hover:scale-105"
        >
          Normal Action
        </button>

        <button
          onClick={() =>
            simulateAction(true)
          }
          className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white transition hover:scale-105"
        >
          Simulate Attack
        </button>

      </div>

      {/* ================================================= */}
      {/* ORACLE */}
      {/* ================================================= */}

      <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-6">

        <div className="mb-4 flex items-center gap-3">

          <Bug className="h-6 w-6 text-purple-400" />

          <h2 className="text-xl font-bold text-white">
            Oracle Scroll
          </h2>

        </div>

        <div className="space-y-3">

          {oraclePredictions.length ===
          0 ? (
            <p className="text-gray-500">
              No predictions yet
            </p>
          ) : (
            oraclePredictions
              .slice()
              .reverse()
              .map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4"
                >
                  <p className="font-semibold text-purple-300">
                    {item.prediction}
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    Source:
                    {" "}
                    {item.source_endpoint}
                  </p>
                </div>
              ))
          )}

        </div>

      </div>

      {/* ================================================= */}
      {/* HONEYPOT */}
      {/* ================================================= */}

      <div className="rounded-2xl border border-red-500/20 bg-black/40 p-6">

        <div className="mb-4 flex items-center gap-3">

          <ShieldAlert className="h-6 w-6 text-red-400" />

          <h2 className="text-xl font-bold text-white">
            Honeypot Isolation Chamber
          </h2>

        </div>

        <div className="space-y-3">

          {honeypotEvents.length ===
          0 ? (
            <p className="text-gray-500">
              No honeypot events
            </p>
          ) : (
            honeypotEvents
              .slice()
              .reverse()
              .map((event, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 p-4"
                >
                  <div className="flex items-center justify-between">

                    <p className="font-bold text-red-300">
                      {event.agent_id}
                    </p>

                    <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                      {event.score}
                    </span>

                  </div>

                  <p className="mt-2 text-sm text-gray-300">
                    Endpoint:
                    {" "}
                    {event.endpoint}
                  </p>

                </div>
              ))
          )}

        </div>

      </div>

    </div>
  );
}

interface CardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function Card({
  title,
  value,
  icon,
}: CardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-gray-400">
            {title}
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            {value}
          </h2>

        </div>

        {icon}

      </div>

    </div>
  );
}