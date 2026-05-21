function Landing() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-16">

      {/* HERO */}
      <div className="text-center">
        <h1 className="text-6xl md:text-7xl font-extrabold text-yellow-400">
          SKADOOSH QUANTUM AEGIS
        </h1>

        <p className="mt-6 text-2xl text-gray-300">
          The Post-Quantum AI Agent Security Gateway
        </p>
      </div>

      {/* PO SECTION */}
      <div className="mt-16 max-w-5xl mx-auto bg-zinc-900 border border-yellow-500 rounded-3xl p-10 shadow-2xl">

        <h2 className="text-5xl font-bold text-orange-400">
          🐼 PO — THE CENTRAL GATEWAY
        </h2>

        <p className="mt-6 text-lg text-gray-400 leading-relaxed">
          Every AI message enters through PO.
          Nothing bypasses the gateway.
          PO sequences all 5 warriors before allowing execution.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">

          <div className="bg-black p-5 rounded-2xl border border-zinc-700">
            <h3 className="text-yellow-300 text-2xl font-semibold">
              ⚡ Kyber-1024 Channels
            </h3>

            <p className="mt-2 text-gray-400">
              Quantum-safe encrypted communication between all agents.
            </p>
          </div>

          <div className="bg-black p-5 rounded-2xl border border-zinc-700">
            <h3 className="text-cyan-300 text-2xl font-semibold">
              🧠 Trust Score Network
            </h3>

            <p className="mt-2 text-gray-400">
              Real-time live trust scoring for every AI agent.
            </p>
          </div>

          <div className="bg-black p-5 rounded-2xl border border-zinc-700">
            <h3 className="text-green-300 text-2xl font-semibold">
              🛡️ 3-of-5 Threshold Signing
            </h3>

            <p className="mt-2 text-gray-400">
              High-value actions require multiple Dilithium approvals.
            </p>
          </div>

          <div className="bg-black p-5 rounded-2xl border border-zinc-700">
            <h3 className="text-red-300 text-2xl font-semibold">
              📊 Live Security Dashboards
            </h3>

            <p className="mt-2 text-gray-400">
              Monitor audit logs, threats, honeypots, and risk scores live.
            </p>
          </div>

        </div>
      </div>

      {/* WARRIORS */}
      <div className="mt-20 max-w-6xl mx-auto">

        <h2 className="text-5xl font-bold text-center text-yellow-400">
          THE FIVE WARRIORS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">

          {/* MONKEY */}
          <div className="bg-zinc-900 p-6 rounded-3xl border border-yellow-500 hover:scale-105 transition">

            <h3 className="text-3xl text-yellow-300 font-bold">
              🐒 MONKEY
            </h3>

            <p className="mt-4 text-gray-400">
              Post-Quantum Identity & Replay Protection
            </p>

            <ul className="mt-4 space-y-2 text-gray-300">
              <li>• Dilithium Quantum Signatures</li>
              <li>• Replay Attack Blocking</li>
            </ul>
          </div>

          {/* CRANE */}
          <div className="bg-zinc-900 p-6 rounded-3xl border border-blue-500 hover:scale-105 transition">

            <h3 className="text-3xl text-blue-300 font-bold">
              🦢 CRANE
            </h3>

            <p className="mt-4 text-gray-400">
              Scoped Capability Enforcement
            </p>

            <ul className="mt-4 space-y-2 text-gray-300">
              <li>• JWT Capability Tokens</li>
              <li>• Mid-Execution Validation</li>
            </ul>
          </div>

          {/* SNAKE */}
          <div className="bg-zinc-900 p-6 rounded-3xl border border-green-500 hover:scale-105 transition">

            <h3 className="text-3xl text-green-300 font-bold">
              🐍 SNAKE
            </h3>

            <p className="mt-4 text-gray-400">
              Tamper-Proof Quantum Audit Chain
            </p>

            <ul className="mt-4 space-y-2 text-gray-300">
              <li>• SHA3-256 Audit Ledger</li>
              <li>• Merkle Tamper Detection</li>
            </ul>
          </div>

          {/* TIGRESS */}
          <div className="bg-zinc-900 p-6 rounded-3xl border border-red-500 hover:scale-105 transition">

            <h3 className="text-3xl text-red-300 font-bold">
              🐯 TIGRESS
            </h3>

            <p className="mt-4 text-gray-400">
              Prompt Injection Defense
            </p>

            <ul className="mt-4 space-y-2 text-gray-300">
              <li>• ArmorClaw Scanner</li>
              <li>• Session Drift Detection</li>
            </ul>
          </div>

          {/* MANTIS */}
          <div className="bg-zinc-900 p-6 rounded-3xl border border-cyan-500 md:col-span-2 hover:scale-105 transition">

            <h3 className="text-3xl text-cyan-300 font-bold">
              🦗 MANTIS
            </h3>

            <p className="mt-4 text-gray-400">
              AI Threat Detection Engine
            </p>

            <ul className="mt-4 space-y-2 text-gray-300">
              <li>• Gemini Behavioral Scoring</li>
              <li>• Honeypot Isolation Routing</li>
            </ul>
          </div>

        </div>
      </div>

      {/* SECTORS */}
      <div className="mt-20 max-w-6xl mx-auto">

        <h2 className="text-5xl font-bold text-center text-orange-400">
          SECTORS DEFENDED BY SQA
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">

          <div className="bg-zinc-900 p-6 rounded-3xl border border-yellow-500">
            <h3 className="text-2xl font-bold text-yellow-300">
              🏦 Banking
            </h3>

            <p className="mt-4 text-gray-400">
              Quantum-safe financial signing and zero stolen-key access.
            </p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-3xl border border-green-500">
            <h3 className="text-2xl font-bold text-green-300">
              🏥 Healthcare
            </h3>

            <p className="mt-4 text-gray-400">
              Tamper-proof audit trails and HIPAA-safe agent controls.
            </p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-3xl border border-blue-500">
            <h3 className="text-2xl font-bold text-blue-300">
              ⚖️ Legal
            </h3>

            <p className="mt-4 text-gray-400">
              Verifiable execution and immutable evidence trails.
            </p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-3xl border border-red-500">
            <h3 className="text-2xl font-bold text-red-300">
              🏛️ Government
            </h3>

            <p className="mt-4 text-gray-400">
              Quantum-safe intelligence and post-quantum communications.
            </p>
          </div>

        </div>
      </div>

      {/* REQUEST ACCESS */}
      <div className="mt-24 max-w-3xl mx-auto bg-zinc-900 p-10 rounded-3xl border border-yellow-500">

        <h2 className="text-5xl text-center font-bold text-yellow-400">
          REQUEST ACCESS
        </h2>

        <div className="mt-8 flex flex-col gap-4">

          <input
            type="text"
            placeholder="Your Name"
            className="bg-black border border-zinc-700 rounded-xl p-4"
          />

          <input
            type="email"
            placeholder="Your Email"
            className="bg-black border border-zinc-700 rounded-xl p-4"
          />

          <textarea
            placeholder="Why do you want access?"
            className="bg-black border border-zinc-700 rounded-xl p-4 h-40"
          />

          <button className="bg-yellow-400 text-black font-bold py-4 rounded-xl hover:bg-yellow-300 transition">
            Request Access
          </button>

        </div>

      </div>

    </div>
  );
}

export default Landing;