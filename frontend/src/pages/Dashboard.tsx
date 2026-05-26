import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import AttackSimulationPanel from "../components/Po/AttackSimulationPanel";
import MonkeySection from "../components/Monkey/MonkeySection";
import CraneSection from "../components/Crane/CraneSection";
import SnakeSection from "../components/Snake/SnakeSection";
import MantisSection from "../components/Mantis/MantisSection";
import TigressSection from "../components/Tigress/TigressSection";
import PoSection from "../components/Po/PoSection";
import LiveRiskChart from "../components/Po/LiveRiskChart";
import BFTConsensusPanel from "../components/Po/BFTConsensusPanel";
import FinanceApprovalPanel from "../components/Po/FinanceApprovalPanel";
import AuditChainPanel from "../components/Po/AuditChainPanel";
import HoneypotPanel from "../components/Po/HoneypotPanel";
import PipelineVisualizer from "../components/Po/PipelineVisualizer";
import useSecurityFeed from "../hooks/useSecurityFeed";
import { useAuth } from "../hooks/useAuth";
import {
  fetchDashboardOverview, fetchLiveDashboard, fetchLiveRiskFeed,
  fetchBFTRequests, fetchFinanceRequests, fetchAuditChain,
  fetchHoneypotFeed, fetchPipelineFeed,
} from "../api/poApi";
import {
  fetchSnakeChainStatus, fetchSnakeCheckpoints,
  fetchTrustScores, triggerDemoAttack,
} from "../api/adminApi";
import {
  Shield, Activity, Lock, AlertTriangle, Database, Brain,
  Radio, Eye, Clock, Cpu, Terminal,
  Network, GitBranch, CheckCircle, XCircle, ArrowRight
} from "lucide-react";

// =========================================================
// ATTACK BUTTONS
// =========================================================

const QUICK_ATTACKS = [
  { id: 'replay-attack', label: 'Replay', icon: Radio, color: 'text-red-400 border-red-500/30 hover:bg-red-500/10' },
  { id: 'prompt-injection', label: 'Injection', icon: AlertTriangle, color: 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10' },
  { id: 'anomaly-burst', label: 'Anomaly', icon: Brain, color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' },
  { id: 'token-expiry', label: 'Token Expiry', icon: Clock, color: 'text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10' },
  { id: 'honeypot-route', label: 'Honeypot', icon: Eye, color: 'text-pink-400 border-pink-500/30 hover:bg-pink-500/10' },
  { id: 'tamper-detection', label: 'Tamper', icon: Database, color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10' },
  { id: 'quantum-key-forge', label: 'Quantum Forge', icon: Cpu, color: 'text-purple-400 border-purple-500/30 hover:bg-purple-500/10' },
]

function severityColor(s: string) {
  if (s === 'CRITICAL') return 'bg-red-500/20 text-red-400'
  if (s === 'HIGH') return 'bg-orange-500/20 text-orange-400'
  if (s === 'MEDIUM') return 'bg-yellow-500/20 text-yellow-400'
  return 'bg-cyan-500/20 text-cyan-400'
}

// =========================================================
// METRIC CARD
// =========================================================

function MetricCard({ icon, title, value, color = 'text-cyan-400' }: any) {
  const bgColor = color === 'text-red-400' ? 'bg-red-500/5 border-red-500/30' :
                  color === 'text-orange-400' ? 'bg-orange-500/5 border-orange-500/30' :
                  color === 'text-green-400' ? 'bg-green-500/5 border-green-500/30' :
                  'bg-cyan-500/5 border-cyan-500/30'
  const iconBg = color === 'text-red-400' ? 'bg-red-500/10 text-red-400' :
                 color === 'text-orange-400' ? 'bg-orange-500/10 text-orange-400' :
                 color === 'text-green-400' ? 'bg-green-500/10 text-green-400' :
                 'bg-cyan-500/10 text-cyan-400'

  return (
    <div className={`rounded-2xl border ${bgColor} p-6 backdrop-blur-sm hover:border-opacity-60 transition-all group`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</div>
          <div className={`text-4xl font-black ${color} leading-tight`}>{value}</div>
        </div>
        <div className={`rounded-xl ${iconBg} p-3.5 group-hover:scale-110 transition-transform`}>{icon}</div>
      </div>
    </div>
  )
}

// =========================================================
// TRUST SCORE PANEL
// =========================================================

function TrustScorePanel({ scores }: { scores: any[] }) {
  return (
    <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-[#071224] to-[#0a1424] p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10">
            <Network size={18} className="text-blue-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Agent Trust Scores</h3>
        </div>
        <span className="text-xs font-bold text-blue-300 bg-blue-500/20 px-3 py-1.5 rounded-full">MONITORED</span>
      </div>
      {scores.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No agents tracked yet. Register agents to see trust scores.</p>
      ) : (
        <div className="space-y-2">
          {scores.slice(0, 8).map((s: any, i: number) => {
            const score = s.trust_score ?? s.score ?? 0
            const agentId = s.agent_id || s.id || `agent_${i}`
            const color = score > 80 ? 'bg-green-400' : score > 50 ? 'bg-yellow-400' : 'bg-red-400'
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-32 truncate flex-shrink-0">{agentId}</span>
                <div className="flex-1 bg-white/5 rounded-full h-1.5">
                  <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
                </div>
                <span className={`text-xs font-mono w-8 text-right ${score > 80 ? 'text-green-400' : score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>{score}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// =========================================================
// ATTACK DETECTION PANEL
// =========================================================

function AttackDetectionPanel({ events }: { events: any[] }) {
  const categories = {
    'REPLAY_ATTACK': { label: 'Replay Attacks', icon: Radio, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
    'PROMPT_INJECTION': { label: 'Prompt Injections', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
    'AUDIT_TAMPER_DETECTED': { label: 'Tamper Alerts', icon: Database, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
    'MANTIS_HIGH_RISK': { label: 'Behavioral Anomalies', icon: Brain, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    'HONEYPOT_ROUTE': { label: 'Honeypot Captures', icon: Eye, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30' },
    'SIGNATURE_FAILURE': { label: 'Signature Failures', icon: Cpu, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
    'TOKEN_EXPIRED': { label: 'Token Expiries', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  }

  const counts: Record<string, number> = {}
  for (const [key] of Object.entries(categories)) {
    counts[key] = events.filter(e => e.event_type === key).length
  }

  return (
    <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/5 via-[#071224] to-[#0a1424] p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-500/10">
            <Shield size={18} className="text-red-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Threat Intelligence</h3>
        </div>
        <span className="text-xs font-bold text-red-300 bg-red-500/20 px-3 py-1.5 rounded-full animate-pulse">ACTIVE</span>
      </div>
      <div className="space-y-2">
        {Object.entries(categories).map(([key, { label, icon: Icon, color }]) => (
          <div key={key} className="flex items-center gap-3 rounded-xl border border-white/5 px-3 py-2">
            <Icon size={14} className={color} />
            <span className="text-xs text-gray-400 flex-1">{label}</span>
            <span className={`text-sm font-black ${counts[key] > 0 ? color : 'text-gray-600'}`}>{counts[key]}</span>
            {counts[key] > 0 && <CheckCircle size={12} className="text-green-400" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// =========================================================
// MERKLE TREE PANEL
// =========================================================

function MerkleTreePanel({ chainStatus, checkpoints }: { chainStatus: any; checkpoints: any[] }) {
  const tampered = chainStatus?.tampered ?? false
  return (
    <div className={`rounded-2xl border ${tampered ? 'border-red-500/30 bg-gradient-to-br from-red-500/5 via-[#071224] to-[#0a1424]' : 'border-green-500/30 bg-gradient-to-br from-green-500/5 via-[#071224] to-[#0a1424]'} p-6 backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${tampered ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
            <GitBranch size={18} className={tampered ? 'text-red-400' : 'text-green-400'} />
          </div>
          <h3 className="text-sm font-bold text-white">Immutable Audit Chain (SNAKE)</h3>
        </div>
        {tampered ? (
          <span className="text-xs font-bold text-red-300 bg-red-500/20 border border-red-500/40 px-3 py-1.5 rounded-full animate-pulse">⚠ TAMPER DETECTED</span>
        ) : (
          <span className="text-xs font-bold text-green-300 bg-green-500/20 border border-green-500/40 px-3 py-1.5 rounded-full">✓ VERIFIED</span>
        )}
      </div>
      {chainStatus && (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-gray-500">
            <span>Chain Length</span>
            <span className="text-white font-mono">{chainStatus.total_entries ?? 0}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Chain Valid</span>
            <span className={chainStatus.chain_valid ? 'text-green-400' : 'text-red-400'}>
              {chainStatus.chain_valid ? '✓ VERIFIED' : '✗ COMPROMISED'}
            </span>
          </div>
          {chainStatus.merkle_root && (
            <div className="flex justify-between text-gray-500">
              <span>Merkle Root</span>
              <span className="text-cyan-400 font-mono truncate ml-4">{String(chainStatus.merkle_root).slice(0, 20)}...</span>
            </div>
          )}
        </div>
      )}
      {checkpoints.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-2">Recent Checkpoints</div>
          <div className="space-y-1">
            {checkpoints.slice(0, 3).map((cp: any, i: number) => (
              <div key={i} className={`rounded-lg border ${tampered && i === 0 ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'} px-3 py-2 text-xs font-mono`}>
                <div className="text-gray-400 truncate">{String(cp.merkle_root || '').slice(0, 30)}...</div>
                <div className="text-gray-600 mt-0.5">chain_length: {cp.chain_length}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =========================================================
// CAPABILITY DECISIONS PANEL
// =========================================================

function CapabilityDecisionsPanel({ events }: { events: any[] }) {
  const craneEvents = events.filter(e =>
    ['TOKEN_EXPIRED', 'CAPABILITY_BLOCKED', 'MULTISIG_APPROVED', 'TRIBUNAL_DECISION'].includes(e.event_type) ||
    (e.metadata?.blocked_by && String(e.metadata.blocked_by).includes('crane'))
  ).slice(0, 8)

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-[#071224] to-[#0a1424] p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10">
            <Lock size={18} className="text-blue-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Capability Governance (CRANE)</h3>
        </div>
        <span className="text-xs font-bold text-blue-300 bg-blue-500/20 px-3 py-1.5 rounded-full">ENFORCING</span>
      </div>
      {craneEvents.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No CRANE events yet.<br />
          <span className="text-xs text-gray-600">Try the token-expiry or anomaly attack triggers above.</span>
        </p>
      ) : (
        <div className="space-y-2">
          {craneEvents.map((evt, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-white/5 px-3 py-2">
              {evt.severity === 'HIGH' || evt.severity === 'CRITICAL'
                ? <XCircle size={14} className="text-red-400 flex-shrink-0" />
                : <CheckCircle size={14} className="text-green-400 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{evt.event_type}</div>
                <div className="text-[10px] text-gray-500 truncate">{evt.agent_id}</div>
              </div>
              <span className={`text-xs flex-shrink-0 px-2 py-0.5 rounded-full ${severityColor(evt.severity)}`}>{evt.severity}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =========================================================
// MAIN DASHBOARD
// =========================================================

export default function Dashboard() {
  const { connected, events } = useSecurityFeed()
  const { user, signOut } = useAuth()

  const [_overview, setOverview] = useState<any>({})
  const [metrics, setMetrics] = useState<any>({})
  const [riskFeed, setRiskFeed] = useState<any[]>([])
  const [bftRequests, setBftRequests] = useState<any[]>([])
  const [financeRequests, setFinanceRequests] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [honeypotEvents, setHoneypotEvents] = useState<any[]>([])
  const [pipelineFeed, setPipelineFeed] = useState<any[]>([])
  const [chainStatus, setChainStatus] = useState<any>(null)
  const [checkpoints, setCheckpoints] = useState<any[]>([])
  const [trustScores, setTrustScores] = useState<any[]>([])
  const [triggeringAttack, setTriggeringAttack] = useState<string | null>(null)
  const [attackLog, setAttackLog] = useState<string[]>([])
  const [selectedSector, setSelectedSector] = useState<string>("all")

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, 3000)
    return () => clearInterval(interval)
  }, [])

  async function loadDashboard() {
    try {
      // Batch 1: Core overview and metrics (3 requests)
      const [overviewData, liveData, riskData] =
        await Promise.allSettled([
          fetchDashboardOverview(),
          fetchLiveDashboard(),
          fetchLiveRiskFeed(),
        ])

      if (overviewData.status === 'fulfilled') setOverview(overviewData.value)
      if (liveData.status === 'fulfilled') setMetrics(liveData.value.metrics || {})
      if (riskData.status === 'fulfilled') setRiskFeed(riskData.value.risk_feed || [])

      // Batch 2: Financial and audit data (3 requests)
      const [bft, finance, audit] =
        await Promise.allSettled([
          fetchBFTRequests(),
          fetchFinanceRequests(),
          fetchAuditChain(),
        ])

      if (bft.status === 'fulfilled') setBftRequests(bft.value || [])
      if (finance.status === 'fulfilled') setFinanceRequests(finance.value || [])
      if (audit.status === 'fulfilled') setAuditLogs(audit.value || [])

      // Batch 3: Honeypot, pipeline, and security chain (3 requests)
      const [honey, pipeline, snake] =
        await Promise.allSettled([
          fetchHoneypotFeed(),
          fetchPipelineFeed(),
          fetchSnakeChainStatus(),
        ])

      if (honey.status === 'fulfilled') setHoneypotEvents(honey.value.events || [])
      if (pipeline.status === 'fulfilled') setPipelineFeed(pipeline.value.pipeline || [])
      if (snake.status === 'fulfilled') setChainStatus(snake.value)

      // Batch 4: Checkpoints and trust scores (2 requests)
      const [cps, trust] =
        await Promise.allSettled([
          fetchSnakeCheckpoints(),
          fetchTrustScores(),
        ])

      if (cps.status === 'fulfilled') setCheckpoints(cps.value.checkpoints || [])
      if (trust.status === 'fulfilled') {
        const trustData = trust.value
        const scores = trustData.scores || trustData.agents || trustData || []
        setTrustScores(Array.isArray(scores) ? scores : [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleAttack(attackId: string) {
    setTriggeringAttack(attackId)
    try {
      const res = await triggerDemoAttack(attackId)
      setAttackLog(prev => [`[${new Date().toLocaleTimeString()}] ${attackId}: ${res.detail}`, ...prev.slice(0, 9)])
    } catch (e: any) {
      setAttackLog(prev => [`[ERROR] ${attackId}: ${e.message}`, ...prev.slice(0, 9)])
    }
    setTriggeringAttack(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#020617] to-[#0d0b1a] text-white">

      {/* ================================================= */}
      {/* TOP NAVIGATION */}
      {/* ================================================= */}
      <header className="sticky top-0 z-40 border-b border-cyan-500/10 bg-[#020617]/95 backdrop-blur-2xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Shield size={18} className="text-white font-bold" />
              </div>
              <div className="flex flex-col gap-0">
                <span className="font-black text-white tracking-widest text-base">SQA</span>
                <span className="text-[10px] text-cyan-400/60 font-mono tracking-wider">Dragon Warrior</span>
              </div>
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <div className={`flex items-center gap-2.5 text-xs font-mono px-3 py-1.5 rounded-lg transition-all ${connected ? 'bg-green-500/10 text-green-300 border border-green-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {connected ? 'CONNECTED' : 'OFFLINE'}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/demo" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10">
              <Terminal size={14} /> Live Demo
            </Link>
            <Link to="/admin" className="text-xs font-semibold text-gray-300 hover:text-white transition px-4 py-2 rounded-lg border border-gray-500/30 hover:border-gray-500/60 hover:bg-white/5">
              Admin Panel
            </Link>
            {user && (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/10">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-medium text-white">{user.email?.split('@')[0]}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{user.email?.split('@')[1]}</span>
                </div>
                <button
                  onClick={signOut}
                  className="text-xs font-semibold text-gray-400 hover:text-red-400 transition px-3 py-1.5 rounded-lg border border-gray-500/20 hover:border-red-500/30 hover:bg-red-500/5"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================================================= */}
      {/* ATTACK SIMULATION TOOLBAR */}
      {/* ================================================= */}
      <div className="border-b border-white/10 bg-gradient-to-r from-[#060d1a] via-[#0a0a15] to-[#060d1a] px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex-shrink-0">Test Scenarios:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {QUICK_ATTACKS.map(a => {
                  const Icon = a.icon
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleAttack(a.id)}
                      disabled={triggeringAttack === a.id}
                      className={`flex items-center gap-1.5 text-xs font-semibold border ${a.color} px-3 py-1.5 rounded-lg transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {triggeringAttack === a.id
                        ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : <Icon size={13} />}
                      {a.label}
                    </button>
                  )
                })}
              </div>
            </div>
            {attackLog.length > 0 && (
              <div className="flex items-center gap-2 ml-auto bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-mono text-green-300 truncate max-w-xs">{attackLog[0]}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* KEY METRICS */}
      {/* ================================================= */}
      <section className="px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Key Metrics</h2>
            <p className="text-sm text-gray-400 mt-1">Real-time security dashboard overview</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={<Activity size={22} />} title="Total Requests" value={metrics.total_requests || 0} />
            <MetricCard icon={<Shield size={22} />} title="Threats Blocked" value={metrics.blocked_requests || 0} color="text-red-400" />
            <MetricCard icon={<AlertTriangle size={22} />} title="High Risk Alerts" value={metrics.mantis_high_risk || 0} color="text-orange-400" />
            <MetricCard icon={<Lock size={22} />} title="BFT Approvals" value={metrics.bft_approvals || 0} color="text-green-400" />
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* P9 — SECTOR FILTER (Global Security Command Dashboard) */}
      {/* ================================================= */}
      <section className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-300">Sector Filter (P9):</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#111827] px-4 py-2 text-sm text-white hover:border-white/20 transition-colors focus:outline-none focus:border-cyan-500/30"
            >
              <option value="all">All Sectors</option>
              <option value="banking">Banking</option>
              <option value="healthcare">Healthcare</option>
              <option value="government">Government</option>
              <option value="legal">Legal</option>
            </select>
            <span className="text-xs text-gray-600">
              {selectedSector === "all" ? "Showing all agent activity" : `Showing ${selectedSector} sector`}
            </span>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* SECURITY MODULES */}
      {/* ================================================= */}
      <section className="space-y-8 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">Security Modules</h2>
          <p className="text-sm text-gray-400 mb-8">Deep dive into each security layer</p>
        </div>
        <MonkeySection />
        <CraneSection />
        <SnakeSection />
        <MantisSection />
        <TigressSection />
        <PoSection />
      </section>

      {/* ================================================= */}
      {/* REAL-TIME ANALYTICS */}
      {/* ================================================= */}
      <section className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">Real-Time Analytics</h2>
          <p className="text-sm text-gray-400 mb-8">Integrated security insights across all modules</p>
        </div>
        <div className="grid gap-6 px-6 xl:grid-cols-2 max-w-7xl mx-auto w-full">
        <LiveRiskChart data={riskFeed} />
        <BFTConsensusPanel requests={bftRequests} />
        <FinanceApprovalPanel requests={financeRequests} />
        <AuditChainPanel logs={auditLogs} />
        <HoneypotPanel events={honeypotEvents} />
        <PipelineVisualizer pipeline={pipelineFeed} />

        {/* New panels */}
        <TrustScorePanel scores={trustScores} />
        <AttackDetectionPanel events={events} />
        <MerkleTreePanel chainStatus={chainStatus} checkpoints={checkpoints} />
        <CapabilityDecisionsPanel events={events} />

        {/* Attack simulation */}
        <AttackSimulationPanel />
        </div>
      </section>

      {/* ================================================= */}
      {/* LIVE SECURITY EVENTS */}
      {/* ================================================= */}
      <section className="px-6 pb-20 max-w-7xl mx-auto w-full">
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 via-[#071224] to-[#0a1424] p-7 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Live Security Events</h2>
              <p className="text-sm text-gray-400 mt-2">Real-time WebSocket feed from all security modules</p>
            </div>
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all ${connected ? 'bg-green-500/10 border-green-500/40 text-green-300' : 'bg-red-500/10 border-red-500/40 text-red-300'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className={`text-xs font-semibold`}>
                {connected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>
          <div className="space-y-2.5">
            {events.slice(0, 25).map((event, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-4 flex items-center justify-between gap-4 transition-all hover:border-white/10 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition">{event.event_type}</span>
                    {event.agent_id && event.agent_id !== 'SYSTEM' && (
                      <span className="text-xs text-gray-500 font-mono bg-white/5 px-2.5 py-1 rounded-full">{event.agent_id}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1.5 line-clamp-1">{event.message || event.title}</div>
                </div>
                <span className={`rounded-lg px-3.5 py-1.5 text-xs font-bold flex-shrink-0 whitespace-nowrap ${severityColor(event.severity)}`}>
                  {event.severity || 'LOW'}
                </span>
              </motion.div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-sm mb-4">No events captured yet.</div>
                <button onClick={() => handleAttack('replay-attack')} className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-2 group">
                  Trigger a test attack <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
