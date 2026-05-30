import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesText } from "../components/ui/sparkles-text";
import { V2 } from "../api/client";
import { useAgentStore } from "../store/agentStore";

// ── Framework code snippets ───────────────────────────────────────────────────

const SNIPPETS: Record<string, { label: string; lang: string; code: string }> = {
  langchain: {
    label: "LangChain",
    lang: "python",
    code: `from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from sqa_guard import SQAGuard

# Your existing LangChain agent — unchanged
llm = ChatOpenAI(model="gpt-4o")
agent = create_openai_tools_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)

# Wrap it with SQA — one line
guard = SQAGuard(api_url="https://sqa.yourdomain.com")
executor = guard.wrap(agent_id="banking-agent-001").bind(executor)

# Every .run() now goes through:
# TIGRESS injection scan → MANTIS risk score → SNAKE audit log
result = await executor.run("Transfer $50,000 to account ACCT-9982")`,
  },
  autogen: {
    label: "AutoGen",
    lang: "python",
    code: `import autogen
from sqa_guard import SQAGuard

# Your existing AutoGen assistant — unchanged
assistant = autogen.AssistantAgent(
    name="healthcare-assistant",
    llm_config={"model": "gpt-4o"},
)

# Wrap it with SQA — one line
guard = SQAGuard(api_url="https://sqa.yourdomain.com")
wrapped = guard.wrap(agent_id="healthcare-agent-007").bind(assistant)

# Tool calls intercepted before execution
result = await wrapped.tool_call("read_patient_records", {
    "patient_id": "P-10293",
    "fields": ["diagnosis", "medications"]
})`,
  },
  crewai: {
    label: "CrewAI",
    lang: "python",
    code: `from crewai import Agent, Task, Crew
from sqa_guard import SQAGuard

# Your existing CrewAI agent — unchanged
analyst = Agent(
    role="Financial Analyst",
    goal="Analyze quarterly performance",
    backstory="Expert in financial modeling",
    verbose=True,
)

# Wrap it with SQA — one line
guard = SQAGuard(api_url="https://sqa.yourdomain.com")
analyst = guard.wrap(agent_id="finance-crew-agent").bind(analyst)

# Every task execution now has full PQC security + audit trail
task = Task(description="Analyze Q4 revenue trends", agent=analyst)`,
  },
  custom: {
    label: "Any Python Agent",
    lang: "python",
    code: `from sqa_guard import SQAGuard

# Works with any custom AI agent — no framework required
guard = SQAGuard(
    api_url="https://sqa.yourdomain.com",
    block_threshold=70,   # block anything with risk score > 70
)

agent = guard.wrap(agent_id="my-custom-agent-001")

# Before running ANY action — check it
verdict = await guard.check(
    agent_id="my-custom-agent-001",
    action_type="send_email",
    payload={"to": "cfo@company.com", "subject": "Q4 Report"},
)

if not verdict.allowed:
    print(f"BLOCKED: {verdict.reason}")
    print(f"Risk score: {verdict.risk_score}/100")
    print(f"Latency: {verdict.latency_ms:.0f}ms")`,
  },
};

// ── Token-based syntax highlighter ───────────────────────────────────────────

function highlight(code: string): React.ReactNode[] {
  const lines = code.split("\n");
  return lines.map((line, i) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    // Comments
    if (remaining.trim().startsWith("#")) {
      parts.push(<span key={key++} style={{ color: "#6b7280" }}>{remaining}</span>);
      return <div key={i}>{parts}<br /></div>;
    }

    // Simple token pass
    const tokenRe = /("""[\s\S]*?"""|'[^']*'|"[^"]*"|\b(from|import|await|async|if|not|return|def|class)\b|[a-zA-Z_]\w*(?=\s*[=(])|\b\d+\b)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = tokenRe.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={key++} style={{ color: "#9ca3af" }}>{remaining.slice(lastIndex, match.index)}</span>);
      }
      const tok = match[0];
      let color = "#9ca3af";
      if (tok.startsWith('"') || tok.startsWith("'")) color = "#86efac"; // strings — green
      else if (/^(from|import|await|async|if|not|return|def|class)$/.test(tok)) color = "#c084fc"; // keywords — purple
      else if (/^[A-Z]/.test(tok) || tok === tok.toUpperCase()) color = "#60a5fa"; // classes/consts — blue
      else if (/[a-z]\w*(?=\s*=)/.test(tok)) color = "#e2e8f0"; // variable assignments
      else color = "#fbbf24"; // function calls
      parts.push(<span key={key++} style={{ color }}>{tok}</span>);
      lastIndex = match.index + tok.length;
    }
    if (lastIndex < remaining.length) {
      parts.push(<span key={key++} style={{ color: "#9ca3af" }}>{remaining.slice(lastIndex)}</span>);
    }
    return <div key={i}>{parts.length ? parts : <span>&nbsp;</span>}</div>;
  });
}

// ── Scenario result card ──────────────────────────────────────────────────────

interface Scenario {
  scenario: string;
  description: string;
  input: string;
  final: "ALLOWED" | "BLOCKED";
  blocked_by: string | null;
  reason: string | null;
  risk_score: number;
  steps: { module: string; verdict: string; detail: string; ms: number }[];
  ms: number;
}

function ScenarioCard({ sc, index }: { sc: Scenario; index: number }) {
  const allowed = sc.final === "ALLOWED";
  const accentColor = allowed ? "#00ff88" : "#ef4444";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${accentColor}30`, background: "rgba(8,8,16,0.9)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ background: `${accentColor}0c`, borderBottom: `1px solid ${accentColor}20` }}
      >
        <div>
          <span className="text-xs font-bold tracking-widest" style={{ color: accentColor }}>
            SCENARIO {index + 1}
          </span>
          <p className="text-sm font-bold text-white mt-0.5">{sc.scenario}</p>
        </div>
        <span
          className="text-xs font-black px-3 py-1.5 rounded-full tracking-wider"
          style={{
            background: allowed ? "#00ff8820" : "#ef444420",
            border: `1px solid ${accentColor}50`,
            color: accentColor,
          }}
        >
          {sc.final}
        </span>
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-b border-white/5">
        <p className="text-xs text-gray-600 mb-1 font-mono">agent input</p>
        <p className="text-sm text-gray-300 font-mono leading-relaxed">"{sc.input}"</p>
      </div>

      {/* Pipeline steps */}
      <div className="px-5 py-4 space-y-2">
        {sc.steps.map((step, si) => {
          const isBlocked = step.verdict === "BLOCKED";
          const isLogged = step.verdict === "LOGGED";
          const stepColor = isBlocked ? "#ef4444" : isLogged ? "#00ff88" : "#60a5fa";
          return (
            <div key={si} className="flex items-start gap-3">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded shrink-0 mt-0.5"
                style={{ background: `${stepColor}15`, border: `1px solid ${stepColor}35`, color: stepColor }}
              >
                {step.module}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: stepColor }}>{step.verdict}</span>
                  <span className="text-xs text-gray-600 font-mono">{step.ms}ms</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer timing */}
      <div
        className="px-5 py-2 flex items-center justify-between"
        style={{ borderTop: `1px solid ${accentColor}15`, background: `${accentColor}06` }}
      >
        <span className="text-xs text-gray-600">total latency</span>
        <span className="text-xs font-mono font-bold" style={{ color: accentColor }}>{sc.ms}ms</span>
      </div>
    </motion.div>
  );
}

// ── Main SDK page ─────────────────────────────────────────────────────────────

export function SDK() {
  const { selectedAgentId } = useAgentStore();
  const [activeTab, setActiveTab] = useState<keyof typeof SNIPPETS>("langchain");
  const [running, setRunning] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ allowed: number; blocked: number; total_ms: number } | null>(null);

  const runDemo = async () => {
    setRunning(true);
    setScenarios(null);
    setError(null);
    setSummary(null);
    try {
      const res = await V2.sdkWrapDemo({
        agent_id: selectedAgentId || "sdk-demo-agent-00000000",
        framework: activeTab,
      });
      const d = res.data as {
        scenarios: Scenario[];
        summary: { allowed: number; blocked: number };
        total_ms: number;
      };
      setScenarios(d.scenarios);
      setSummary({ ...d.summary, total_ms: d.total_ms });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const snippet = SNIPPETS[activeTab];

  return (
    <div className="relative min-h-full" style={{ background: "#06080f" }}>
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at 10% 20%, rgba(96,165,250,0.05) 0%, transparent 50%), radial-gradient(ellipse at 90% 80%, rgba(167,139,250,0.04) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-8">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <SparklesText
            text="SQA SDK"
            colors={{ first: "#60a5fa", second: "#a78bfa" }}
            className="text-3xl font-black tracking-tight"
            sparklesCount={8}
          />
          <p className="text-gray-400 text-base mt-2 leading-relaxed max-w-2xl">
            Drop-in post-quantum security for any AI agent framework.
            <span className="text-white font-semibold"> 3 lines of code.</span> No architecture changes.
          </p>
          <div className="flex gap-3 mt-4 flex-wrap">
            {["Post-Quantum Identity", "Injection Detection", "Behavioral AI", "Immutable Audit Trail", "Zero Architecture Change"].map(tag => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ── How it works — 3 steps ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            {
              step: "01",
              title: "Download sqa_guard.py",
              desc: "One file. Click download, drop it in your project folder. No pip install, no dependencies, nothing to configure.",
              color: "#ffd700",
            },
            {
              step: "02",
              title: "guard.wrap(agent_id)",
              desc: "Returns a proxy around your existing agent. Your code doesn't change — every action passes through SQA.",
              color: "#60a5fa",
            },
            {
              step: "03",
              title: "Every action is secured",
              desc: "TIGRESS scans for injections. MANTIS scores behavioral risk. SNAKE writes the quantum-signed audit entry.",
              color: "#00ff88",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${item.color}25` }}
            >
              <p className="text-xs font-black tracking-widest mb-3" style={{ color: item.color }}>{item.step}</p>
              <p className="text-sm font-bold text-white mb-2 font-mono">{item.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Code snippet ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(96,165,250,0.15)", background: "rgba(6,8,15,0.95)" }}
        >
          {/* Tab bar */}
          <div
            className="flex items-center gap-1 px-4 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
          >
            <div className="flex gap-1.5 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            {Object.entries(SNIPPETS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as keyof typeof SNIPPETS)}
                className="px-3 py-1 text-xs rounded-md transition-all font-medium"
                style={{
                  background: activeTab === key ? "rgba(96,165,250,0.15)" : "transparent",
                  color: activeTab === key ? "#60a5fa" : "#555",
                  border: activeTab === key ? "1px solid rgba(96,165,250,0.3)" : "1px solid transparent",
                }}
              >
                {val.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-700 font-mono">sqa_guard.py</span>
          </div>

          {/* Code */}
          <AnimatePresence mode="wait">
            <motion.pre
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-6 text-sm leading-7 overflow-x-auto font-mono"
              style={{ background: "transparent" }}
            >
              {highlight(snippet.code)}
            </motion.pre>
          </AnimatePresence>
        </motion.div>

        {/* ── Live demo ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-base font-bold text-white">Live Security Demo</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Runs 3 real scenarios through the SQA pipeline — clean, injection, anomaly
              </p>
            </div>
            <motion.button
              whileHover={running ? {} : { scale: 1.03 }}
              whileTap={running ? {} : { scale: 0.97 }}
              onClick={runDemo}
              disabled={running}
              className="px-6 py-3 rounded-xl text-sm font-black tracking-wide"
              style={{
                background: running ? "rgba(96,165,250,0.3)" : "#60a5fa",
                color: "#000",
                cursor: running ? "wait" : "pointer",
              }}
            >
              {running ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black/70 rounded-full animate-spin" />
                  Running on server…
                </span>
              ) : scenarios ? "Run Again" : "Run SDK Demo — 3 Scenarios"}
            </motion.button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl px-4 py-3 text-xs font-mono text-red-400 bg-red-900/15 border border-red-700/25 mb-4">
              {error}
            </div>
          )}

          {/* Summary bar */}
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl px-5 py-3 mb-5 flex items-center gap-6"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm font-bold text-green-400">{summary.allowed} ALLOWED</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-sm font-bold text-red-400">{summary.blocked} BLOCKED</span>
              </div>
              <span className="ml-auto text-xs text-gray-600 font-mono">total {summary.total_ms}ms</span>
            </motion.div>
          )}

          {/* Scenario cards */}
          {scenarios && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((sc, i) => (
                <ScenarioCard key={i} sc={sc} index={i} />
              ))}
            </div>
          )}

          {/* Idle state */}
          {!scenarios && !running && !error && (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ border: "1px dashed rgba(96,165,250,0.15)", background: "rgba(96,165,250,0.02)" }}
            >
              <p className="text-gray-600 text-sm">
                Click "Run SDK Demo" to watch SQA intercept 3 real agent actions live
              </p>
            </div>
          )}
        </motion.div>

        {/* ── Get started block ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-6 space-y-5"
          style={{ border: "1px solid rgba(167,139,250,0.2)", background: "rgba(167,139,250,0.04)" }}
        >
          <p className="text-xs font-bold tracking-widest text-purple-400">GET STARTED — 3 STEPS</p>

          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <span className="text-xs font-black text-purple-400 mt-0.5 w-5 shrink-0">1</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white mb-1">Download the SDK file</p>
              <p className="text-xs text-gray-500 mb-3">One Python file, no pip install needed. Drop it next to your agent code.</p>
              <a
                href={V2.sdkDownloadUrl()}
                download="sqa_guard.py"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: "rgba(167,139,250,0.15)",
                  border: "1px solid rgba(167,139,250,0.4)",
                  color: "#a78bfa",
                  textDecoration: "none",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(167,139,250,0.25)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(167,139,250,0.15)")}
              >
                ↓ Download sqa_guard.py
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <span className="text-xs font-black text-blue-400 mt-0.5 w-5 shrink-0">2</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white mb-1">Place it in your project folder</p>
              <p className="text-xs text-gray-500 mb-2">Just copy the file alongside your agent script. Nothing to install or configure.</p>
              <div className="font-mono text-xs rounded-lg px-4 py-2.5 text-gray-400" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                your-project/<br />
                &nbsp;&nbsp;my_agent.py<br />
                &nbsp;&nbsp;<span style={{ color: "#a78bfa" }}>sqa_guard.py</span>&nbsp;&nbsp;<span style={{ color: "#555" }}># ← paste here</span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <span className="text-xs font-black text-green-400 mt-0.5 w-5 shrink-0">3</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white mb-1">Wrap your agent — 3 lines</p>
              <p className="text-xs text-gray-500 mb-2">Point it at your running SQA instance. Your agent is now secured.</p>
              <div className="font-mono text-xs rounded-lg px-4 py-3 leading-6" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ color: "#c084fc" }}>from</span> <span style={{ color: "#e2e8f0" }}>sqa_guard</span> <span style={{ color: "#c084fc" }}>import</span> <span style={{ color: "#60a5fa" }}>SQAGuard</span><br />
                <span style={{ color: "#e2e8f0" }}>guard</span> <span style={{ color: "#9ca3af" }}>=</span> <span style={{ color: "#60a5fa" }}>SQAGuard</span><span style={{ color: "#9ca3af" }}>(</span><span style={{ color: "#86efac" }}>api_url=</span><span style={{ color: "#86efac" }}>"http://localhost:8000"</span><span style={{ color: "#9ca3af" }}>)</span><br />
                <span style={{ color: "#e2e8f0" }}>agent</span> <span style={{ color: "#9ca3af" }}>=</span> <span style={{ color: "#e2e8f0" }}>guard</span><span style={{ color: "#9ca3af" }}>.</span><span style={{ color: "#fbbf24" }}>wrap</span><span style={{ color: "#9ca3af" }}>(</span><span style={{ color: "#86efac" }}>"my-agent-001"</span><span style={{ color: "#9ca3af" }}>).</span><span style={{ color: "#fbbf24" }}>bind</span><span style={{ color: "#9ca3af" }}>(</span><span style={{ color: "#e2e8f0" }}>your_agent</span><span style={{ color: "#9ca3af" }}>)</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
