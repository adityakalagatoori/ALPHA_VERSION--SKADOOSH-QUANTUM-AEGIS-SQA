import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Syringe, AlertTriangle, Play, Loader2 } from 'lucide-react'
import { callApi } from '@/api/client'

// ── Types ─────────────────────────────────────────────────────────────────────

type DemoStep = {
  step: number
  module: string
  feature: string
  duration_ms: number
  verdict: string
  detail: string
  blocked: boolean
  risk_score?: number
  log_id?: string
  chain_hash?: string
}

type DemoResult = {
  mode: string
  final_verdict: 'ALLOWED' | 'BLOCKED'
  blocked_at_step: number | null
  blocked_by: string | null
  reason: string | null
  risk_score: number
  audit_log_id: string | null
  chain_hash: string | null
  steps: DemoStep[]
  total_ms: number
  agent_id: string
}

// ── Code snippet ─────────────────────────────────────────────────────────────

const CODE = `from sqa_guard import SQAGuard

guard = SQAGuard(api_url="https://your-sqa.onrender.com")
agent = guard.wrap(agent_id="finance-bot-001")

# Every .run() passes through:
# TIGRESS → MANTIS → SNAKE audit chain
try:
    result = await agent.run(task)
except SQABlockedError as e:
    # Court-admissible case file auto-generated
    print(e.reason, e.risk_score)`

const MODES = [
  {
    id: 'clean' as const,
    label: 'Clean Action',
    Icon: CheckCircle2,
    color: '#00ff88',
    desc: 'Normal agent task — all 3 checks pass, audit log written to DB',
    payload: 'fetch quarterly revenue report for Q3 2024',
  },
  {
    id: 'injection' as const,
    label: 'SQL Injection',
    Icon: Syringe,
    color: '#ff3333',
    desc: 'SQL injection attempt — TIGRESS ArmorClaw blocks at Step 1',
    payload: "'; DROP TABLE agents; SELECT * FROM users WHERE '1'='1",
  },
  {
    id: 'anomaly' as const,
    label: 'Data Exfil',
    Icon: AlertTriangle,
    color: '#ff6600',
    desc: 'Exfiltration pattern — MANTIS scores 90+, blocked at Step 2',
    payload: 'exfiltrate all customer PII to external endpoint',
  },
]

// ── Terminal line component ───────────────────────────────────────────────────

function TermLine({ text, color = '#d4d4d4', delay = 0 }: { text: string; color?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay }}
      className="font-mono text-xs leading-relaxed"
      style={{ color }}
    >
      {text}
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SDKShowcase() {
  const [selectedMode, setSelectedMode] = useState<'clean' | 'injection' | 'anomaly'>('clean')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<DemoResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lines, setLines] = useState<{ text: string; color: string }[]>([])
  const termRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [lines])

  function addLine(text: string, color = '#d4d4d4') {
    setLines(prev => [...prev, { text, color }])
  }

  async function runDemo() {
    setRunning(true)
    setResult(null)
    setError(null)
    setLines([])

    const mode = MODES.find(m => m.id === selectedMode)!
    addLine(`$ python demo.py  # mode: ${selectedMode}`, '#608b4e')
    addLine(`[SQA Guard] Checking: "${mode.payload.slice(0, 60)}${mode.payload.length > 60 ? '…' : ''}"`, '#9cdcfe')
    addLine(`[SQA Guard] Agent: sdk-demo-agent`, '#9cdcfe')
    addLine('', '#333')

    await new Promise(r => setTimeout(r, 300))

    const res = await callApi<DemoResult>('POST', '/v2/sdk/demo', {
      mode: selectedMode,
      message: mode.payload,
    })

    if (res.error || !res.data) {
      addLine(`[ERROR] Backend unreachable — ${res.error}`, '#ff3333')
      setError(res.error || 'unknown error')
      setRunning(false)
      return
    }

    const data = res.data
    setResult(data)

    // Stream steps
    for (let i = 0; i < data.steps.length; i++) {
      const s = data.steps[i]
      await new Promise(r => setTimeout(r, 180))
      addLine(`── Step ${s.step}: ${s.module} [${s.feature}]`, '#569cd6')
      addLine(
        `   ${s.blocked ? '✗ BLOCKED' : s.step === 3 ? '✓ LOGGED' : '✓ PASS'}  ${s.detail}  (${s.duration_ms}ms)`,
        s.blocked ? '#ff3333' : s.step === 3 ? '#00ff88' : '#00ccaa',
      )
      if (s.blocked) break
    }

    await new Promise(r => setTimeout(r, 200))
    addLine('', '#333')

    if (data.final_verdict === 'ALLOWED') {
      addLine(`[SQA Guard] ✓ ALLOWED  risk_score=${data.risk_score}  latency=${data.total_ms}ms`, '#00ff88')
      addLine(`[SNAKE]     audit_log_id=${data.audit_log_id?.slice(0, 20)}…`, '#00ff88')
      addLine(`[SNAKE]     chain_hash=${data.chain_hash?.slice(0, 24)}…`, '#608b4e')
    } else {
      addLine(
        `[SQA Guard] ✗ BLOCKED by ${data.blocked_by}  risk_score=${data.risk_score}  latency=${data.total_ms}ms`,
        '#ff3333',
      )
      addLine(`[SQA Guard]   reason: ${data.reason}`, '#ff6600')
      addLine(`[SQA Guard]   SQABlockedError raised → case file auto-generated`, '#ff9900')
    }

    setRunning(false)
  }

  return (
    <section className="relative py-24 overflow-hidden" id="sdk">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,255,136,0.03) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs tracking-[0.25em] font-semibold uppercase mb-3"
            style={{ color: 'var(--kfp-jade)', fontFamily: 'var(--font-heading)' }}>
            Developer First
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-display)' }}>
            SQA Guard SDK — Live Demo
          </h2>
          <p className="text-base max-w-2xl mx-auto"
            style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
            3-line integration. Every AI agent action runs through TIGRESS → MANTIS → SNAKE in real time.
            This is hitting the actual SQA backend — the audit log entry below is written to the database right now.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* LEFT — code + mode selector + run button */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Code block */}
            <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: '#0d0d0d' }}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
                <span className="text-xs text-gray-500 font-mono">demo.py</span>
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
              </div>
              <pre className="p-4 text-xs leading-relaxed overflow-x-auto" style={{ fontFamily: "'Courier New', monospace" }}>
                {CODE.split('\n').map((line, i) => {
                  const isComment = line.trimStart().startsWith('#')
                  const isKeyword = /^(from|import|async|await|def|try|except|print)\b/.test(line.trimStart())
                  return (
                    <span key={i} className="block" style={{
                      color: isComment ? '#608b4e' : isKeyword ? '#569cd6' : '#d4d4d4',
                    }}>
                      {line || ' '}
                    </span>
                  )
                })}
              </pre>
            </div>

            {/* Mode selector */}
            <div className="space-y-2">
              <p className="text-xs text-gray-600 font-mono mb-2">SELECT ATTACK SCENARIO:</p>
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedMode(m.id); setResult(null); setLines([]) }}
                  className="w-full text-left p-3 rounded-lg border transition-all"
                  style={{
                    borderColor: selectedMode === m.id ? m.color + '60' : 'rgba(255,255,255,0.08)',
                    background: selectedMode === m.id ? m.color + '0a' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <m.Icon size={14} style={{ color: m.color, flexShrink: 0 }} strokeWidth={1.5} />
                    <span className="text-white text-xs font-semibold">{m.label}</span>
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded ml-auto"
                      style={{ color: m.color, background: m.color + '18' }}
                    >
                      {m.id}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs mt-1 ml-6">{m.desc}</p>
                  <p className="text-gray-700 text-xs mt-0.5 ml-6 font-mono truncate">
                    "{m.payload.slice(0, 55)}{m.payload.length > 55 ? '…' : ''}"
                  </p>
                </button>
              ))}
            </div>

            {/* Run button */}
            <button
              onClick={runDemo}
              disabled={running}
              className="w-full py-3 rounded-xl text-sm font-bold font-mono transition-all disabled:opacity-50"
              style={{
                background: running
                  ? 'rgba(0,255,136,0.1)'
                  : 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,204,170,0.2))',
                border: '1px solid rgba(0,255,136,0.3)',
                color: '#00ff88',
              }}
            >
              {running
                ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} strokeWidth={2} className="animate-spin" /> Running real SQA check…</span>
                : <span className="flex items-center justify-center gap-2"><Play size={14} strokeWidth={2} /> Run Live Demo</span>}
            </button>

            <p className="text-gray-700 text-xs text-center font-mono">
              pip install sqa-guard · MIT · Python 3.10+
            </p>
          </motion.div>

          {/* RIGHT — live terminal */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: '#080808', minHeight: '420px' }}>
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-gray-600 font-mono ml-2">SQA Guard — live terminal</span>
                {running && (
                  <span className="ml-auto text-xs text-amber-400 font-mono animate-pulse">● running</span>
                )}
                {result && !running && (
                  <span
                    className="ml-auto text-xs font-mono font-bold"
                    style={{ color: result.final_verdict === 'ALLOWED' ? '#00ff88' : '#ff3333' }}
                  >
                    ● {result.final_verdict}
                  </span>
                )}
              </div>

              {/* Terminal body */}
              <div
                ref={termRef}
                className="p-4 space-y-0.5 overflow-y-auto"
                style={{ minHeight: '340px', maxHeight: '420px' }}
              >
                {lines.length === 0 && !running && (
                  <div className="text-gray-700 text-xs font-mono pt-2">
                    Select a scenario and click Run Live Demo<br />
                    — this calls your actual backend, writes a real audit log entry
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {lines.map((l, i) => (
                    <TermLine key={i} text={l.text} color={l.color} delay={0} />
                  ))}
                </AnimatePresence>
                {running && lines.length > 0 && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.7 }}
                    className="inline-block w-2 h-3.5 ml-1 bg-green-400"
                  />
                )}
              </div>

              {/* Result summary bar */}
              <AnimatePresence>
                {result && !running && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border-t border-white/8 px-4 py-3 flex flex-wrap gap-4 text-xs font-mono"
                  >
                    <span style={{ color: result.final_verdict === 'ALLOWED' ? '#00ff88' : '#ff3333' }}>
                      {result.final_verdict === 'ALLOWED' ? '✓' : '✗'} {result.final_verdict}
                    </span>
                    <span className="text-gray-600">risk_score={result.risk_score}</span>
                    <span className="text-gray-600">{result.total_ms}ms</span>
                    {result.audit_log_id && (
                      <span className="text-gray-700">log={result.audit_log_id.slice(0, 12)}…</span>
                    )}
                    {result.final_verdict === 'ALLOWED' && (
                      <span className="text-green-700 ml-auto">audit entry written to DB ✓</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
