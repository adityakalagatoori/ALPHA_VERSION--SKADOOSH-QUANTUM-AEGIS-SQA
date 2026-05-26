import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Activity, Users, Settings, Zap, Terminal,
  CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw,
  ArrowLeft, Radio, Database, Brain, Eye, Cpu
} from 'lucide-react'
import { fetchSystemHealth, fetchFeatureFlags, fetchApprovedUsers, triggerDemoAttack } from '../api/adminApi'
import { getAccessRequests, approveRequest, rejectRequest } from '../api/accessApi'
import useSecurityFeed from '../hooks/useSecurityFeed'
import { ADMIN_SECRET } from '../lib/api'

type Tab = 'requests' | 'users' | 'health' | 'flags' | 'traffic' | 'demo'

// =========================================================
// STATUS DOT
// =========================================================

function StatusDot({ status }: { status: string }) {
  const isUp = ['ACTIVE', 'CONNECTED', 'CONFIGURED', 'ONLINE'].includes(status?.toUpperCase() || '')
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
      isUp
        ? 'border-green-500/30 bg-green-500/10 text-green-400'
        : 'border-red-500/30 bg-red-500/10 text-red-400'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      {status}
    </span>
  )
}

// =========================================================
// DEMO ATTACK BUTTONS
// =========================================================

const DEMO_ATTACKS = [
  { id: 'replay-attack', label: 'Replay Attack', icon: Radio, color: 'red', module: 'MONKEY M5' },
  { id: 'prompt-injection', label: 'Prompt Injection', icon: AlertTriangle, color: 'orange', module: 'TIGRESS T2' },
  { id: 'anomaly-burst', label: 'Anomaly Burst', icon: Brain, color: 'emerald', module: 'MANTIS A3' },
  { id: 'token-expiry', label: 'Token Expiry', icon: Clock, color: 'yellow', module: 'CRANE C6' },
  { id: 'honeypot-route', label: 'Honeypot Route', icon: Eye, color: 'pink', module: 'MANTIS A7' },
  { id: 'tamper-detection', label: 'Tamper Detection', icon: Database, color: 'cyan', module: 'SNAKE S4' },
  { id: 'quantum-key-forge', label: 'Quantum Key Forge', icon: Cpu, color: 'purple', module: 'MONKEY M3' },
]

const attackColorMap: Record<string, string> = {
  red: 'border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10',
  orange: 'border-orange-500/30 bg-orange-500/5 text-orange-400 hover:bg-orange-500/10',
  emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10',
  yellow: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400 hover:bg-yellow-500/10',
  pink: 'border-pink-500/30 bg-pink-500/5 text-pink-400 hover:bg-pink-500/10',
  cyan: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10',
  purple: 'border-purple-500/30 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10',
}

// =========================================================
// MAIN ADMIN PAGE
// =========================================================

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('requests')
  const [accessRequests, setAccessRequests] = useState<any[]>([])
  const [approvedUsers, setApprovedUsers] = useState<any[]>([])
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [featureFlags, setFeatureFlags] = useState<any>(null)
  const [demoLogs, setDemoLogs] = useState<string[]>([])
  const [triggeringAttack, setTriggeringAttack] = useState<string | null>(null)
  const { connected, events } = useSecurityFeed()

  useEffect(() => {
    loadData()
    const interval = setInterval(() => {
      if (activeTab === 'health') loadHealth()
    }, 5000)
    return () => clearInterval(interval)
  }, [activeTab])

  async function loadData() {
    try { const data = await getAccessRequests(ADMIN_SECRET); setAccessRequests(data.requests || []) } catch {}
    try { const data = await fetchApprovedUsers(); setApprovedUsers(data.users || []) } catch {}
    loadHealth()
    try { const data = await fetchFeatureFlags(); setFeatureFlags(data.flags) } catch {}
  }

  async function loadHealth() {
    try { const data = await fetchSystemHealth(); setSystemHealth(data) } catch {}
  }

  async function handleApprove(id: string) {
    try {
      const res = await approveRequest(id, ADMIN_SECRET)
      setDemoLogs(prev => [`[APPROVED] ${res.email} — temp password: ${res.temp_password}`, ...prev])
      await loadData()
    } catch (e: any) {
      setDemoLogs(prev => [`[ERROR] ${e.message}`, ...prev])
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectRequest(id, ADMIN_SECRET)
      await loadData()
    } catch {}
  }

  async function handleDemoAttack(attackId: string) {
    setTriggeringAttack(attackId)
    try {
      const res = await triggerDemoAttack(attackId)
      setDemoLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ${attackId.toUpperCase()} → ${res.detail || 'Event emitted to WebSocket'}`,
        ...prev.slice(0, 49)
      ])
    } catch (e: any) {
      setDemoLogs(prev => [`[ERROR] ${e.message}`, ...prev])
    }
    setTriggeringAttack(null)
  }

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'requests', label: 'Access Requests', icon: Users },
    { id: 'users', label: 'Users', icon: Shield },
    { id: 'health', label: 'System Health', icon: Activity },
    { id: 'flags', label: 'Feature Flags', icon: Settings },
    { id: 'traffic', label: 'Live Traffic', icon: Radio },
    { id: 'demo', label: 'Demo Control', icon: Zap },
  ]

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0b1220] px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-500 hover:text-white transition">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-black" />
          </div>
          <div>
            <div className="font-black text-white tracking-widest text-sm">SQA ADMIN</div>
            <div className="text-xs text-gray-500">System Control Panel</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-2 text-xs font-mono ${connected ? 'text-green-400' : 'text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {connected ? 'WS LIVE' : 'WS OFFLINE'}
          </span>
          <Link to="/dashboard" className="text-xs text-cyan-400 hover:text-cyan-300 transition border border-cyan-500/20 px-3 py-1.5 rounded-lg">
            Dashboard →
          </Link>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar tabs */}
        <div className="w-56 min-h-screen border-r border-white/5 bg-[#060d1a] p-4">
          <nav className="space-y-1">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">

          {/* === ACCESS REQUESTS === */}
          {activeTab === 'requests' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white">Access Requests</h2>
                <button onClick={loadData} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition">
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
              <div className="space-y-3">
                {accessRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">No access requests yet</div>
                ) : (
                  accessRequests.map(req => (
                    <div key={req.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <span className="font-semibold text-white">{req.full_name}</span>
                            <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                              req.status === 'approved' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
                              req.status === 'rejected' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                              'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                            }`}>{req.status.toUpperCase()}</span>
                            <span className="text-xs text-gray-500 border border-white/10 px-2 py-0.5 rounded-full">{req.sector}</span>
                          </div>
                          <div className="text-sm text-gray-400">{req.email} · {req.organization}</div>
                          <div className="text-xs text-gray-600 mt-1">{req.purpose}</div>
                        </div>
                        {req.status === 'pending' && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="flex items-center gap-1.5 text-xs font-bold bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 px-3 py-2 rounded-lg transition"
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="flex items-center gap-1.5 text-xs font-bold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-3 py-2 rounded-lg transition"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* === USERS === */}
          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-black text-white mb-6">Approved Users ({approvedUsers.length})</h2>
              <div className="space-y-3">
                {approvedUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">No approved users yet</div>
                ) : (
                  approvedUsers.map(user => (
                    <div key={user.id} className="rounded-xl border border-white/5 bg-white/[0.02] px-5 py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-white">{user.full_name}</div>
                        <div className="text-sm text-gray-400">{user.email} · {user.organization}</div>
                      </div>
                      <span className="text-xs font-mono bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{user.role}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* === SYSTEM HEALTH === */}
          {activeTab === 'health' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white">System Health</h2>
                <button onClick={loadHealth} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition">
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
              {systemHealth ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(systemHealth.modules || {}).map(([name, data]: [string, any]) => (
                      <div key={name} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-white uppercase">{name}</span>
                          <StatusDot status={data.status || 'UNKNOWN'} />
                        </div>
                        {Object.entries(data).filter(([k]) => k !== 'status').map(([k, v]) => (
                          <div key={k} className="text-xs text-gray-500">{k}: <span className="text-gray-400">{String(v)}</span></div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {/* Metrics */}
                  {systemHealth.metrics && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 mt-4">
                      <h3 className="text-sm font-bold text-white mb-3">Live Metrics</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {[
                          ['Total Requests', systemHealth.metrics.total_requests],
                          ['Blocked', systemHealth.metrics.blocked_requests],
                          ['Prompt Injections', systemHealth.metrics.prompt_injections],
                          ['Replay Attacks', systemHealth.metrics.replay_attacks],
                          ['WS Clients', systemHealth.websocket_clients],
                        ].map(([label, value]) => (
                          <div key={label as string} className="text-center">
                            <div className="text-2xl font-black text-cyan-400">{value}</div>
                            <div className="text-xs text-gray-500 mt-1">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 text-sm">Loading health data...</div>
              )}
            </div>
          )}

          {/* === FEATURE FLAGS === */}
          {activeTab === 'flags' && (
            <div>
              <h2 className="text-xl font-black text-white mb-6">Feature Flags</h2>
              {featureFlags ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(featureFlags).map(([flag, value]) => (
                    <div key={flag} className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 flex items-center justify-between">
                      <span className="text-sm font-mono text-gray-300">{flag}</span>
                      <StatusDot status={value ? 'ACTIVE' : 'INACTIVE'} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 text-sm">Loading flags...</div>
              )}
            </div>
          )}

          {/* === LIVE TRAFFIC === */}
          {activeTab === 'traffic' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-black text-white">Live Traffic</h2>
                <span className={`flex items-center gap-1.5 text-xs font-mono ${connected ? 'text-green-400' : 'text-red-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {events.slice(0, 50).map((evt, i) => (
                  <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs font-mono">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`font-bold ${
                        evt.severity === 'CRITICAL' ? 'text-red-400' :
                        evt.severity === 'HIGH' ? 'text-orange-400' :
                        evt.severity === 'MEDIUM' ? 'text-yellow-400' : 'text-cyan-400'
                      }`}>[{evt.severity}]</span>
                      <span className="text-white">{evt.event_type}</span>
                      <span className="text-gray-500">{evt.agent_id}</span>
                    </div>
                    <div className="text-gray-500 mt-1">{evt.message || evt.title}</div>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="text-center py-12 text-gray-500 text-sm">Waiting for events...</div>
                )}
              </div>
            </div>
          )}

          {/* === DEMO CONTROL === */}
          {activeTab === 'demo' && (
            <div>
              <h2 className="text-xl font-black text-white mb-2">Demo Control Center</h2>
              <p className="text-gray-400 text-sm mb-6">Trigger real security events. Each button emits a WebSocket event visible in the Live Traffic tab and the dashboard.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {DEMO_ATTACKS.map(attack => {
                  const Icon = attack.icon
                  const colorCls = attackColorMap[attack.color]
                  return (
                    <button
                      key={attack.id}
                      onClick={() => handleDemoAttack(attack.id)}
                      disabled={triggeringAttack === attack.id}
                      className={`rounded-2xl border ${colorCls} p-5 text-left transition disabled:opacity-50`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Icon size={22} />
                        {triggeringAttack === attack.id && (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <div className="font-bold text-sm mb-1">{attack.label}</div>
                      <div className="text-xs opacity-60 font-mono">{attack.module}</div>
                    </button>
                  )
                })}
              </div>

              {/* Demo logs */}
              <div className="rounded-2xl border border-white/5 bg-[#020617] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Terminal size={14} className="text-green-400" />
                  <span className="text-xs font-mono text-green-400">RESPONSE LOG</span>
                </div>
                <div className="space-y-1 font-mono text-xs text-green-400 max-h-48 overflow-y-auto">
                  {demoLogs.length === 0 ? (
                    <div className="text-gray-600">Click an attack button to see the response...</div>
                  ) : (
                    demoLogs.map((log, i) => <div key={i}>{log}</div>)
                  )}
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Events are broadcast via WebSocket to all connected dashboards in real-time.
                Open <Link to="/demo" className="text-cyan-400 hover:text-cyan-300">/demo</Link> or{' '}
                <Link to="/dashboard" className="text-cyan-400 hover:text-cyan-300">/dashboard</Link> in another tab to see live updates.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
