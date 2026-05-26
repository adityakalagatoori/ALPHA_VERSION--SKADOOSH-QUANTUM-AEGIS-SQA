import {
  Shield,
  Radio,
  Activity,
  Database,
  Binary,
  AlertTriangle,
  Cpu,
} from "lucide-react";

export default function HeroSection() {

  return (

    <section className="border-b border-cyan-500/20 bg-gradient-to-r from-[#020617] via-[#071426] to-[#020617] px-6 py-10 lg:px-10">

      {/* HEADER */}

      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="mb-4 flex items-center gap-4">

            <div className="rounded-2xl bg-cyan-500/10 p-4">

              <Shield className="h-10 w-10 text-cyan-400" />

            </div>

            <div>

              <h1 className="text-4xl font-black tracking-wide text-white lg:text-6xl">

                SKADOOSH

              </h1>

              <p className="text-cyan-400">

                Quantum AI Defense Operating System

              </p>
            </div>
          </div>

          <p className="max-w-3xl text-gray-400">

            Enterprise-grade post-quantum security architecture
            powered by Kyber1024, ML-DSA-65, immutable audit chains,
            realtime anomaly detection, and AI threat orchestration.

          </p>
        </div>

        {/* STATUS */}

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="h-3 w-3 animate-pulse rounded-full bg-green-400" />

            <p className="font-bold text-green-400">

              ALL SYSTEMS ACTIVE

            </p>
          </div>

          <p className="mt-2 text-sm text-gray-400">

            MONKEY • CRANE • SNAKE • MANTIS • TIGRESS • PO

          </p>
        </div>
      </div>

      {/* STATS */}

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">

        <StatCard
          title="Threat Feed"
          value="LIVE"
          icon={<Radio className="text-cyan-400" />}
        />

        <StatCard
          title="Audit Chain"
          value="ACTIVE"
          icon={<Database className="text-green-400" />}
        />

        <StatCard
          title="Merkle Root"
          value="VERIFIED"
          icon={<Binary className="text-purple-400" />}
        />

        <StatCard
          title="Quantum Layer"
          value="ONLINE"
          icon={<Cpu className="text-yellow-400" />}
        />

        <StatCard
          title="Tamper Status"
          value="SECURE"
          icon={<AlertTriangle className="text-red-400" />}
        />
      </div>

      {/* LIVE BANNER */}

      <div className="mt-8 overflow-hidden rounded-2xl border border-cyan-500/20 bg-black/30">

        <div className="animate-pulse border-b border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-400">

          LIVE COMMAND FEED

        </div>

        <div className="space-y-3 p-5 text-sm">

          <FeedRow
            status="SUCCESS"
            text="Kyber1024 PQC layer initialized"
          />

          <FeedRow
            status="SUCCESS"
            text="Dilithium signing engine online"
          />

          <FeedRow
            status="SUCCESS"
            text="SNAKE audit chain verified"
          />

          <FeedRow
            status="SUCCESS"
            text="Merkle checkpoint synchronized"
          />

          <FeedRow
            status="SUCCESS"
            text="Realtime websocket telemetry active"
          />
        </div>
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
  icon,
}: any) {

  return (

    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-gray-400">

            {title}

          </p>

          <h2 className="mt-2 text-2xl font-black text-white">

            {value}

          </h2>
        </div>

        <div>

          {icon}

        </div>
      </div>
    </div>
  );
}

function FeedRow({
  status,
  text,
}: any) {

  return (

    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3">

      <div className="flex items-center gap-3">

        <Activity className="h-4 w-4 text-cyan-400" />

        <p className="text-gray-300">

          {text}

        </p>
      </div>

      <div className="rounded-lg bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">

        {status}

      </div>
    </div>
  );
}