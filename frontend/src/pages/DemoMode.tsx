import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Terminal, X, Radio, AlertTriangle,
  Brain, Clock, Eye, Database, Cpu, Activity, ChevronRight
} from 'lucide-react'
import useSecurityFeed from '../hooks/useSecurityFeed'
import { triggerDemoAttack } from '../api/adminApi'
import { API_BASE } from '../lib/api'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

const DEMO_ATTACKS = [
  { id: 'replay-attack', label: 'Replay', icon: Radio, color: 'text-red-400', border: 'border-red-500/30 hover:bg-red-500/10' },
  { id: 'prompt-injection', label: 'Injection', icon: AlertTriangle, color: 'text-orange-400', border: 'border-orange-500/30 hover:bg-orange-500/10' },
  { id: 'anomaly-burst', label: 'Anomaly', icon: Brain, color: 'text-emerald-400', border: 'border-emerald-500/30 hover:bg-emerald-500/10' },
  { id: 'token-expiry', label: 'Token Exp', icon: Clock, color: 'text-yellow-400', border: 'border-yellow-500/30 hover:bg-yellow-500/10' },
  { id: 'honeypot-route', label: 'Honeypot', icon: Eye, color: 'text-pink-400', border: 'border-pink-500/30 hover:bg-pink-500/10' },
  { id: 'tamper-detection', label: 'Tamper', icon: Database, color: 'text-cyan-400', border: 'border-cyan-500/30 hover:bg-cyan-500/10' },
  { id: 'quantum-key-forge', label: 'Quantum Forge', icon: Cpu, color: 'text-purple-400', border: 'border-purple-500/30 hover:bg-purple-500/10' },
]

function severityColor(s: string) {
  if (s === 'CRITICAL') return 'text-red-400'
  if (s === 'HIGH') return 'text-orange-400'
  if (s === 'MEDIUM') return 'text-yellow-400'
  return 'text-cyan-400'
}

function formatTime(ts: string) {
  try { return new Date(ts).toLocaleTimeString('en-US', { hour12: false }) } catch { return '' }
}

export default function DemoMode() {
  const { connected, events } = useSecurityFeed()
  const [metrics, setMetrics] = useState<any>(null)
  const [riskData, setRiskData] = useState<any[]>([])
  const [triggering, setTriggering] = useState<string | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const m = await fetch(`${API_BASE}/metrics`).then(r => r.json())
        setMetrics(m)
        const rd = await fetch(`${API_BASE}/po/dashboard/risk/live`).then(r => r.json())
        setRiskData(rd.risk_feed || [])
      } catch {}
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [events])

  async function fireAttack(id: string) {
    setTriggering(id)
    try { await triggerDemoAttack(id) } catch {}
    setTriggering(null)
  }

  const recent = events.slice(0, 20)
  const criticalCount = events.filter(e => e.severity === 'CRITICAL').length
  const blockedCount = metrics?.blocked_requests ?? 0

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#0a1628] px-6 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-cyan-500 rounded-lg flex items-center justify-center">
              <Shield size={14} className="text-black" />
            </div>
            <span className="font-black text-white tracking-widest text-sm">SQA</span>
          </Link>
          <span className="text-xs font-mono border border-red-500/30 bg-red-500/10 text-red-400 px-3 py-1 rounded-full animate-pulse">
            ● LIVE DEMO
          </span>
        </div>

        {/* Attack buttons */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {DEMO_ATTACKS.map(a => {
            const Icon = a.icon
            return (
              <button
                key={a.id}
                onClick={() => fireAttack(a.id)}
                disabled={triggering === a.id}
                title={a.label}
                className={`flex items-center gap-1.5 text-xs font-mono border ${a.border} ${a.color} px-3 py-1.5 rounded-lg transition disabled:opacity-50 flex-shrink-0`}
              >
                {triggering === a.id
                  ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  : <Icon size={12} />}
                {a.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs font-mono ${connected ? 'text-green-400' : 'text-red-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
          <Link to="/dashboard" className="text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
            Dashboard <ChevronRight size={12} />
          </Link>
          <Link to="/" className="text-gray-500 hover:text-white transition">
            <X size={16} />
          </Link>
        </div>
      </div>

      {/* Split screen */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Terminal */}
        <div className="w-[42%] flex flex-col border-r border-white/5 bg-[#050d1a]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <Terminal size={14} className="text-green-400" />
            <span className="text-xs font-mono text-green-400 tracking-widest">SECURITY TERMINAL</span>
            <span className="ml-auto text-xs text-gray-600 font-mono">{events.length} events</span>
          </div>
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1"
          >
            {events.length === 0 && (
              <div className="text-gray-600">
                <span className="text-green-400">$</span> Waiting for security events...<br />
                <span className="text-gray-600">Start backend and click an attack button above</span>
              </div>
            )}
            {[...events].reverse().map((evt, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="leading-relaxed"
              >
                <span className="text-gray-600">[{formatTime(evt.timestamp)}]</span>{' '}
                <span className={`font-bold ${severityColor(evt.severity)}`}>{evt.severity}</span>{' '}
                <span className="text-white">{evt.event_type}</span>
                {evt.agent_id && evt.agent_id !== 'SYSTEM' && (
                  <span className="text-blue-400"> @{evt.agent_id}</span>
                )}
                {(evt.message || evt.title) && (
                  <div className="text-gray-500 ml-4 mt-0.5 truncate">{evt.message || evt.title}</div>
                )}
                {evt.metadata?.blocked_by && (
                  <div className="text-gray-700 ml-4 text-[10px]">→ {evt.metadata.blocked_by}</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT: Mission Control */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Threats Blocked', value: blockedCount, color: 'text-red-400' },
              { label: 'Critical Events', value: criticalCount, color: 'text-orange-400' },
              { label: 'Active Agents', value: (metrics?.active_agents?.length ?? 0), color: 'text-green-400' },
              { label: 'WS Events', value: events.length, color: 'text-cyan-400' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Risk chart */}
          {riskData.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-orange-400" />
                <span className="text-xs font-mono text-gray-400">LIVE RISK SCORES</span>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={riskData.slice(-20)}>
                  <XAxis dataKey="agent_id" hide />
                  <Tooltip
                    contentStyle={{ background: '#0b1220', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line type="monotone" dataKey="risk_score" stroke="#f97316" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Module status */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="text-xs font-mono text-gray-400 mb-3">MODULE STATUS</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { name: 'TIGRESS', color: 'text-orange-400', borderColor: 'border-orange-500/20' },
                { name: 'MONKEY', color: 'text-yellow-400', borderColor: 'border-yellow-500/20' },
                { name: 'CRANE', color: 'text-blue-400', borderColor: 'border-blue-500/20' },
                { name: 'SNAKE', color: 'text-green-400', borderColor: 'border-green-500/20' },
                { name: 'MANTIS', color: 'text-emerald-400', borderColor: 'border-emerald-500/20' },
                { name: 'PO', color: 'text-purple-400', borderColor: 'border-purple-500/20' },
              ].map(m => (
                <div key={m.name} className={`rounded-xl border ${m.borderColor} bg-white/[0.02] p-2 text-center`}>
                  <div className={`text-xs font-black ${m.color}`}>{m.name}</div>
                  <div className="text-[10px] text-green-400 mt-0.5">ACTIVE</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live event feed */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-gray-400">LIVE SECURITY FEED</span>
            </div>
            <div className="space-y-2">
              {recent.length === 0 ? (
                <div className="text-xs text-gray-600 text-center py-4">No events yet. Trigger an attack above.</div>
              ) : (
                recent.map((evt, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2"
                  >
                    <span className={`text-xs font-bold flex-shrink-0 mt-0.5 ${severityColor(evt.severity)}`}>
                      {evt.severity?.slice(0, 4)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{evt.event_type}</div>
                      <div className="text-[11px] text-gray-500 truncate">{evt.message || evt.title}</div>
                    </div>
                    <div className="text-[10px] text-gray-600 flex-shrink-0">{formatTime(evt.timestamp)}</div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Attack type breakdown */}
          {metrics && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="text-xs font-mono text-gray-400 mb-3">ATTACK BREAKDOWN</div>
              <div className="space-y-2">
                {[
                  { label: 'Prompt Injections', value: metrics.prompt_injections, color: 'bg-orange-400' },
                  { label: 'Replay Attacks', value: metrics.replay_attacks, color: 'bg-red-400' },
                  { label: 'Honeypot Routes', value: metrics.honeypot_routes, color: 'bg-pink-400' },
                  { label: 'Signature Failures', value: metrics.signature_failures, color: 'bg-yellow-400' },
                  { label: 'Tamper Alerts', value: metrics.tamper_alerts, color: 'bg-cyan-400' },
                ].map(({ label, value, color }) => {
                  const max = Math.max(1, metrics.blocked_requests || 1)
                  const pct = Math.round((value / max) * 100)
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-36 flex-shrink-0">{label}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-1.5">
                        <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-6 text-right">{value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
