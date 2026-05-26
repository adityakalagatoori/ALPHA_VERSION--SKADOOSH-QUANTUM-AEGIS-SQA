import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Shield, Brain, Cpu, Lock, Eye, Activity, Database,
  ChevronRight, Globe, Building, Heart, Scale,
  AlertTriangle, CheckCircle, ArrowRight, Radio,
  Layers, Network, Terminal
} from 'lucide-react'
import { API_BASE } from '../lib/api'

// =========================================================
// TYPES
// =========================================================

interface LiveMetrics {
  total_requests: number
  blocked_requests: number
  allowed_requests: number
  prompt_injections: number
  replay_attacks: number
  honeypot_routes: number
  tamper_alerts: number
  mantis_high_risk: number
  active_agents: string[]
}

// =========================================================
// FADE IN SECTION WRAPPER
// =========================================================

function FadeInSection({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// =========================================================
// MODULE CARDS DATA
// =========================================================

const MODULES = [
  {
    name: 'MONKEY', codename: 'Post-Quantum Identity',
    desc: 'Kyber-1024 KEM + ML-DSA-65 signatures. Every agent authenticated at quantum-safe cryptographic level.',
    icon: Cpu, color: 'yellow', features: ['Kyber-1024 KEM', 'Dilithium Signatures', 'Replay Prevention', 'Key Blacklisting']
  },
  {
    name: 'CRANE', codename: 'Capability Governance',
    desc: 'JWT tokens with 5-minute expiry, scope enforcement, multi-sig BFT approvals, and real-time checkpoint validation.',
    icon: Lock, color: 'blue', features: ['5-min JWT Tokens', 'Scope Enforcement', 'Multi-sig BFT', 'SHAP Tribunal']
  },
  {
    name: 'SNAKE', codename: 'Immutable Audit Chain',
    desc: 'SHA-3-256 hash chain with ML-DSA-65 signatures per entry. Merkle tree checkpoints every 60 seconds.',
    icon: Database, color: 'green', features: ['SHA-3-256 Ledger', 'Dilithium Signing', 'Merkle Checkpoints', 'Live Tamper Detection']
  },
  {
    name: 'MANTIS', codename: 'Behavioral AI Defense',
    desc: 'Gemini-powered anomaly scoring. 50-action behavioral baseline. Honeypot isolation for score > 90.',
    icon: Brain, color: 'emerald', features: ['50-Action Baseline', 'Gemini Scoring', 'Honeypot Isolation', 'Oracle ML Prediction']
  },
  {
    name: 'TIGRESS', codename: 'Prompt Injection Shield',
    desc: 'Semantic drift detection via SentenceTransformers. ArmorClaw payload scanning. JSON/Base64 injection prevention.',
    icon: Eye, color: 'orange', features: ['Semantic Drift Detection', 'ArmorClaw Scanning', 'JSON Injection Block', 'Base64 Decode Guard']
  },
  {
    name: 'PO', codename: 'Security Pipeline Orchestrator',
    desc: 'Routes every request through all 5 warriors sequentially. Deliver-or-Kill verdicting. Real-time trust network.',
    icon: Shield, color: 'purple', features: ['5-Step Pipeline', 'Deliver or Kill', 'Trust Score Network', 'BFT Finance Approval']
  },
]

const colorMap: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  yellow:  { border: 'border-yellow-500/30',  bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  badge: 'bg-yellow-500/20 text-yellow-300' },
  blue:    { border: 'border-blue-500/30',    bg: 'bg-blue-500/10',    text: 'text-blue-400',    badge: 'bg-blue-500/20 text-blue-300' },
  green:   { border: 'border-green-500/30',   bg: 'bg-green-500/10',   text: 'text-green-400',   badge: 'bg-green-500/20 text-green-300' },
  emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  orange:  { border: 'border-orange-500/30',  bg: 'bg-orange-500/10',  text: 'text-orange-400',  badge: 'bg-orange-500/20 text-orange-300' },
  purple:  { border: 'border-purple-500/30',  bg: 'bg-purple-500/10',  text: 'text-purple-400',  badge: 'bg-purple-500/20 text-purple-300' },
}

const SECTORS = [
  { name: 'Banking', icon: Building, desc: 'Multi-sig approvals, fund transfer governance, real-time fraud detection', color: 'cyan' },
  { name: 'Healthcare', icon: Heart, desc: 'HIPAA-ready BAA config, Gemini guardrails, tamper-proof audit trails', color: 'green' },
  { name: 'Legal', icon: Scale, desc: 'Immutable SHA-3 document chains, Dilithium notarization, full audit lineage', color: 'blue' },
  { name: 'Government', icon: Globe, desc: 'Air-gapped Ollama mode, zero-trust capability tokens, no cloud dependency', color: 'purple' },
]

const ATTACKS = [
  { name: 'Stolen API Key', module: 'MONKEY M4', how: 'ML-DSA-65 blacklist — key revocation propagates instantly', color: 'red' },
  { name: 'Replay Attack', module: 'MONKEY M5', how: 'Nonce + timestamp binding — identical packets rejected permanently', color: 'red' },
  { name: 'Expired JWT Token', module: 'CRANE C6', how: '5-minute TTL enforced at every checkpoint, not just entry', color: 'orange' },
  { name: 'Prompt Injection', module: 'TIGRESS T2/T3', how: 'JSON + Base64 injection patterns detected before reaching handlers', color: 'yellow' },
  { name: 'Behavioral Anomaly', module: 'MANTIS A3/A7', how: 'Gemini scores 0–100; score>90 isolates to honeypot chamber', color: 'orange' },
  { name: 'Audit Log Tamper', module: 'SNAKE S4', how: 'SHA-3 chain integrity checked every 60s; Merkle root alerts instantly', color: 'yellow' },
  { name: 'Out-of-Scope Action', module: 'CRANE C2', how: 'Capability tokens bind allowed_actions; any deviation = 403', color: 'orange' },
]

const PIPELINE_STEPS = [
  { name: 'TIGRESS', desc: 'Injection Defense', icon: Eye, color: 'text-orange-400' },
  { name: 'MONKEY', desc: 'Identity Check', icon: Cpu, color: 'text-yellow-400' },
  { name: 'CRANE', desc: 'Capability Gate', icon: Lock, color: 'text-blue-400' },
  { name: 'SNAKE', desc: 'Audit Log', icon: Database, color: 'text-green-400' },
  { name: 'MANTIS', desc: 'Anomaly Score', icon: Brain, color: 'text-emerald-400' },
  { name: 'PO', desc: 'Deliver or Kill', icon: Shield, color: 'text-purple-400' },
]

// =========================================================
// ANIMATED COUNTER
// =========================================================

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const end = value
    if (start === end) return
    const duration = 1200
    const step = Math.max(1, Math.floor(end / (duration / 16)))
    const timer = setInterval(() => {
      start = Math.min(start + step, end)
      setDisplay(start)
      if (start >= end) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return <span>{display.toLocaleString()}{suffix}</span>
}

// =========================================================
// MAIN LANDING PAGE
// =========================================================

export default function Landing() {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null)
  const [metricsLoaded, setMetricsLoaded] = useState(false)

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch(`${API_BASE}/metrics`)
        if (res.ok) {
          const data = await res.json()
          setMetrics(data)
          setMetricsLoaded(true)
        }
      } catch { /* backend offline */ }
    }
    loadMetrics()
    const interval = setInterval(loadMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden">

      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-black" />
            </div>
            <span className="text-xl font-black text-white tracking-widest">SQA</span>
            <span className="text-xs text-cyan-400/60 font-mono hidden sm:block">DRAGON WARRIOR</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition hidden md:block">Features</a>
            <a href="#architecture" className="text-sm text-gray-400 hover:text-white transition hidden md:block">Architecture</a>
            <Link to="/demo" className="text-sm text-cyan-400 hover:text-cyan-300 transition hidden md:block">Live Demo</Link>
            <Link
              to="/login"
              className="text-sm text-gray-300 hover:text-white transition border border-white/20 px-4 py-2 rounded-lg hover:border-white/40"
            >
              Sign In
            </Link>
            <Link
              to="/request-access"
              className="text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg transition"
            >
              Request Access
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono px-4 py-2 rounded-full mb-8 tracking-widest"
          >
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            POST-QUANTUM AI AGENT SECURITY
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-black text-white leading-tight mb-6"
          >
            Security Built for the Era of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Intelligent Threats
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            SQA is a post-quantum AI agent security gateway that routes every request through
            6 specialized security warriors — blocking attacks before they reach your systems.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/request-access"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-4 rounded-xl text-base transition"
            >
              Request Access <ChevronRight size={18} />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 border border-white/20 hover:border-cyan-500/50 text-white font-semibold px-8 py-4 rounded-xl text-base transition hover:bg-white/5"
            >
              <Terminal size={18} className="text-cyan-400" />
              Live Demo
            </Link>
          </motion.div>

          {/* Tech pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mt-12"
          >
            {['Kyber-1024', 'ML-DSA-65', 'SHA-3-256', 'Gemini AI', 'Zero-Trust', 'ArmorClaw'].map(t => (
              <span key={t} className="text-xs font-mono text-gray-500 border border-white/10 px-3 py-1 rounded-full">{t}</span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== LIVE METRICS BAR ===== */}
      <section className="border-y border-white/5 bg-[#0a1628]/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-mono text-gray-400 tracking-widest">LIVE TELEMETRY</span>
            {!metricsLoaded && <span className="text-xs text-gray-600 font-mono">(backend offline — start backend for live data)</span>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Requests', value: metrics?.total_requests ?? 0, color: 'text-cyan-400', icon: Activity },
              { label: 'Threats Blocked', value: metrics?.blocked_requests ?? 0, color: 'text-red-400', icon: Shield },
              { label: 'Injections Stopped', value: metrics?.prompt_injections ?? 0, color: 'text-orange-400', icon: AlertTriangle },
              { label: 'Replay Attacks', value: metrics?.replay_attacks ?? 0, color: 'text-yellow-400', icon: Radio },
              { label: 'Honeypot Captures', value: metrics?.honeypot_routes ?? 0, color: 'text-pink-400', icon: Brain },
              { label: 'Active Agents', value: metrics?.active_agents?.length ?? 0, color: 'text-green-400', icon: Network },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="text-center rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <Icon size={20} className={`${color} mx-auto mb-2`} />
                <div className={`text-2xl font-black ${color}`}>
                  <AnimatedCounter value={value} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MODULE FEATURES ===== */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <FadeInSection className="text-center mb-16">
          <div className="text-xs font-mono text-cyan-400/60 tracking-widest mb-4">THE SIX WARRIORS</div>
          <h2 className="text-4xl font-black text-white mb-4">Every Layer Purpose-Built</h2>
          <p className="text-gray-400 max-w-xl mx-auto">Six specialized security modules working in sequence, each targeting a distinct attack vector.</p>
        </FadeInSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((mod, i) => {
            const c = colorMap[mod.color]
            const Icon = mod.icon
            return (
              <FadeInSection key={mod.name} delay={i * 0.08}>
                <div className={`rounded-2xl border ${c.border} ${c.bg} p-6 h-full flex flex-col`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${c.border} border ${c.bg}`}>
                      <Icon size={22} className={c.text} />
                    </div>
                    <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${c.badge}`}>ACTIVE</span>
                  </div>
                  <div className={`text-lg font-black ${c.text} mb-1`}>{mod.name}</div>
                  <div className="text-xs text-gray-500 font-mono mb-3 tracking-wide">{mod.codename}</div>
                  <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-1">{mod.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {mod.features.map(f => (
                      <span key={f} className={`text-xs px-2 py-0.5 rounded-full border ${c.border} ${c.text} opacity-80`}>{f}</span>
                    ))}
                  </div>
                </div>
              </FadeInSection>
            )
          })}
        </div>
      </section>

      {/* ===== ATTACK SIMULATION SHOWCASE ===== */}
      <section className="border-y border-white/5 bg-[#060d1a] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <FadeInSection className="text-center mb-12">
            <div className="text-xs font-mono text-red-400/60 tracking-widest mb-4">ATTACK VECTORS NEUTRALIZED</div>
            <h2 className="text-4xl font-black text-white mb-4">Every Known Attack — Blocked</h2>
            <p className="text-gray-400">Live demo shows each attack being attempted and blocked in real-time.</p>
          </FadeInSection>
          <div className="space-y-3">
            {ATTACKS.map((attack, i) => (
              <FadeInSection key={attack.name} delay={i * 0.06}>
                <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 hover:bg-white/[0.04] transition">
                  <div className="w-6 h-6 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={13} className="text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-white text-sm">{attack.name}</span>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                        attack.color === 'red' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                        attack.color === 'orange' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' :
                        'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                      }`}>{attack.module}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{attack.how}</p>
                  </div>
                  <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full flex-shrink-0">BLOCKED</span>
                </div>
              </FadeInSection>
            ))}
          </div>
          <FadeInSection className="text-center mt-10">
            <Link to="/demo" className="inline-flex items-center gap-2 border border-cyan-500/30 text-cyan-400 px-6 py-3 rounded-xl hover:bg-cyan-500/10 transition font-semibold">
              <Terminal size={16} /> Watch Live Demo <ArrowRight size={16} />
            </Link>
          </FadeInSection>
        </div>
      </section>

      {/* ===== SECTORS ===== */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <FadeInSection className="text-center mb-12">
          <div className="text-xs font-mono text-gray-400/60 tracking-widest mb-4">SECTORS PROTECTED</div>
          <h2 className="text-4xl font-black text-white mb-4">Enterprise-Grade for Every Industry</h2>
        </FadeInSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SECTORS.map((s, i) => {
            const Icon = s.icon
            const borderColor = s.color === 'cyan' ? 'border-cyan-500/20' : s.color === 'green' ? 'border-green-500/20' : s.color === 'blue' ? 'border-blue-500/20' : 'border-purple-500/20'
            const textColor = s.color === 'cyan' ? 'text-cyan-400' : s.color === 'green' ? 'text-green-400' : s.color === 'blue' ? 'text-blue-400' : 'text-purple-400'
            return (
              <FadeInSection key={s.name} delay={i * 0.1}>
                <div className={`rounded-2xl border ${borderColor} bg-white/[0.02] p-6 text-center`}>
                  <Icon size={32} className={`${textColor} mx-auto mb-4`} />
                  <h3 className="font-black text-white mb-2">{s.name}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </FadeInSection>
            )
          })}
        </div>
      </section>

      {/* ===== ARCHITECTURE PIPELINE ===== */}
      <section id="architecture" className="border-y border-white/5 bg-[#060d1a] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <FadeInSection className="text-center mb-12">
            <div className="text-xs font-mono text-gray-400/60 tracking-widest mb-4">SECURITY PIPELINE</div>
            <h2 className="text-4xl font-black text-white mb-4">Every Request, Every Layer</h2>
            <p className="text-gray-400">All 6 warriors run sequentially. Any failure stops the pipeline — fail-closed security.</p>
          </FadeInSection>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PIPELINE_STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <FadeInSection key={step.name} delay={i * 0.1} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.03] flex flex-col items-center justify-center gap-1`}>
                      <Icon size={22} className={step.color} />
                      <span className={`text-xs font-black ${step.color}`}>{step.name}</span>
                    </div>
                    <span className="text-xs text-gray-600 mt-1 text-center max-w-[60px]">{step.desc}</span>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <ArrowRight size={16} className="text-gray-700 flex-shrink-0 mt-[-16px]" />
                  )}
                </FadeInSection>
              )
            })}
          </div>
          <FadeInSection className="text-center mt-8">
            <div className="inline-flex items-center gap-2 text-sm text-gray-400">
              <Layers size={14} className="text-purple-400" />
              Agent Request
              <ArrowRight size={12} />
              <span className="text-green-400 font-semibold">DELIVERED</span>
              {' '}or{' '}
              <span className="text-red-400 font-semibold">KILLED</span>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ===== REQUEST ACCESS CTA ===== */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <FadeInSection>
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-12 text-center">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield size={32} className="text-cyan-400" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Ready to Defend Your Platform?</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Request early access to SQA. Our team will review your use case and onboard you within 24 hours.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/request-access"
                className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-4 rounded-xl transition"
              >
                Request Access <ChevronRight size={18} />
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 border border-white/20 hover:border-cyan-500/40 text-white font-semibold px-8 py-4 rounded-xl transition"
              >
                <Terminal size={18} className="text-cyan-400" />
                Try Demo First
              </Link>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-black" />
              </div>
              <div>
                <div className="font-black text-white tracking-widest">SQA</div>
                <div className="text-xs text-gray-500">SKADOOSH Quantum Aegis</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link to="/dashboard" className="hover:text-white transition">Dashboard</Link>
              <Link to="/demo" className="hover:text-white transition">Demo</Link>
              <Link to="/request-access" className="hover:text-white transition">Access</Link>
            </div>
            <div className="text-xs text-gray-600">
              Post-Quantum Security · Built for ArmorIQ Hackathon 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
