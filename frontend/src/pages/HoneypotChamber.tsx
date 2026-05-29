/**
 * HoneypotChamber — Tai Lung's Cage
 * 100% real data from /v2/behavior/honeypot-chamber, zero hardcoding.
 * Canvas orbital mechanics are purely frontend animation state;
 * all agent identities, threat types, reasons, and stats come from the backend.
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { V2 } from "../api/client"

// ─── Backend shape ────────────────────────────────────────────────────────────

interface BackendAgent {
  agent_id: string
  name: string
  sector: string
  trust_score: number
  threat_type: string          // "INJECTION"|"BEHAVIOR"|"IDENTITY"|"REPLAY"|"PRIVILEGE"
  reason: string
  risk_score_at_isolation: number
  isolated_at: string          // ISO timestamp
  fake_responses_served: number
  last_action_attempted: string
}

interface BackendActivity {
  id: string
  agent_id: string
  action: string
  timestamp: string
}

interface ChamberData {
  honeypot_agents: BackendAgent[]
  stats: { isolated: number; fake_responses: number; avg_time_ms: number }
  recent_fake_activity: BackendActivity[]
  oracle: { vector: string; confidence: number; threat_type: string } | null
}

// ─── Orbital mechanics (frontend-only, assigned on first sight) ───────────────

interface OrbitalState {
  angle: number
  orbitRadiusX: number
  orbitRadiusY: number
  angularSpeed: number
  direction: 1 | -1
  arrivalProgress: number  // 0→1 on arrival animation
  exitProgress: number     // 0→1 on removal (only when agent disappears from backend)
}

// Live canvas agent = backend data + orbital state
interface CanvasAgent extends BackendAgent, OrbitalState {}

// ─── Constants ────────────────────────────────────────────────────────────────

type ThreatType = "INJECTION" | "BEHAVIOR" | "IDENTITY" | "REPLAY" | "PRIVILEGE"

const THREAT_COLORS: Record<string, string> = {
  INJECTION: "#7c3aed",
  BEHAVIOR:  "#d97706",
  IDENTITY:  "#dc2626",
  REPLAY:    "#0891b2",
  PRIVILEGE: "#059669",
  DEFAULT:   "#6b7280",
}

const MAX_AGENTS = 12  // cap visible orbits to avoid overcrowding

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

function fmtMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

function fmtIso(iso: string): string {
  try {
    const d = new Date(iso)
    const ms = Date.now() - d.getTime()
    return fmtMs(Math.max(0, ms))
  } catch { return "—" }
}

function threatColor(t: string): string {
  return THREAT_COLORS[t] || THREAT_COLORS.DEFAULT
}

function rf(a: number, b: number) { return a + Math.random() * (b - a) }

function makeOrbital(slotIndex: number): OrbitalState {
  return {
    angle: Math.random() * Math.PI * 2,
    orbitRadiusX: 160 + slotIndex * 50,
    orbitRadiusY: 100 + slotIndex * 30,
    angularSpeed: rf(0.003, 0.009),
    direction: (slotIndex % 2 === 0 ? 1 : -1) as 1 | -1,
    arrivalProgress: 0,
    exitProgress: 0,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HoneypotChamber() {
  // ── React state (right panel display) ──────────────────────────────────────
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [stats, setStats]             = useState({ isolated: 0, fake_responses: 0, avg_time_ms: 0 })
  const [activity, setActivity]       = useState<BackendActivity[]>([])
  const [oracle, setOracle]           = useState<ChamberData["oracle"]>(null)
  const [now, setNow]                 = useState(Date.now())
  const [snapshot, setSnapshot]       = useState<CanvasAgent[]>([])
  const [loading, setLoading]         = useState(true)
  const [empty, setEmpty]             = useState(false)

  // ── Canvas refs (mutated in rAF — never trigger re-renders) ────────────────
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const agentsRef   = useRef<CanvasAgent[]>([])
  const selRef      = useRef<string | null>(null)
  const rafRef      = useRef<number>(0)
  const pulseRef    = useRef({ r: 80, a: 0.28 })

  // Stable orbital slot registry (agent_id → slot index)
  const slotRegistry = useRef<Map<string, number>>(new Map())

  useEffect(() => { selRef.current = selectedId }, [selectedId])

  // ── 1-second clock ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Snapshot canvas agents to state 4×/sec (feeds right panel) ─────────────
  useEffect(() => {
    const t = setInterval(() => setSnapshot([...agentsRef.current]), 250)
    return () => clearInterval(t)
  }, [])

  // ── Poll backend every 5 seconds ───────────────────────────────────────────
  const reconcile = useCallback((data: ChamberData) => {
    const backendAgents = (data.honeypot_agents || []).slice(0, MAX_AGENTS)
    const backendIds = new Set(backendAgents.map(a => a.agent_id))

    // Assign stable slot index to each new agent
    backendAgents.forEach(ba => {
      if (!slotRegistry.current.has(ba.agent_id)) {
        slotRegistry.current.set(ba.agent_id, slotRegistry.current.size)
      }
    })

    const current = agentsRef.current
    const currentById = new Map(current.map(a => [a.agent_id, a]))

    const next: CanvasAgent[] = backendAgents.map(ba => {
      const existing = currentById.get(ba.agent_id)
      if (existing) {
        // Preserve orbital mechanics, update live metadata
        return { ...existing, ...ba }
      }
      // New agent — assign orbital slot and start arrival animation
      const slot = slotRegistry.current.get(ba.agent_id) ?? slotRegistry.current.size
      return { ...ba, ...makeOrbital(slot) }
    })

    // Agents that disappeared from backend: keep them briefly with exitProgress running
    for (const ca of current) {
      if (!backendIds.has(ca.agent_id) && ca.exitProgress < 1) {
        next.push({ ...ca, exitProgress: Math.min(1, ca.exitProgress + 0.08) })
      }
    }

    agentsRef.current = next

    // Update right-panel state
    setStats(data.stats)
    setActivity(data.recent_fake_activity || [])
    setOracle(data.oracle)
    setEmpty(backendAgents.length === 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    const fetch = async () => {
      const res = await V2.honeypotChamber()
      if (res.data) reconcile(res.data as ChamberData)
    }
    fetch()
    timer = setInterval(fetch, 5_000)
    return () => clearInterval(timer)
  }, [reconcile])

  // ── Canvas draw loop ───────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext("2d")
    if (!ctx) return

    const W = cv.width, H = cv.height
    const cx = W / 2, cy = H / 2
    const list = agentsRef.current

    // advance angles & arrival in place
    for (const a of list) {
      a.angle += a.angularSpeed * a.direction
      if (a.arrivalProgress < 1) a.arrivalProgress = Math.min(1, a.arrivalProgress + 0.014)
      if (a.exitProgress > 0)    a.exitProgress    = Math.min(1, a.exitProgress + 0.022)
    }

    // clear
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = "#0a0a0b"
    ctx.fillRect(0, 0, W, H)

    // dot grid
    ctx.fillStyle = "rgba(255,255,255,0.025)"
    for (let x = 0; x < W; x += 30)
      for (let y = 0; y < H; y += 30) {
        ctx.beginPath(); ctx.arc(x, y, 0.8, 0, Math.PI * 2); ctx.fill()
      }

    // center glow
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 230)
    grd.addColorStop(0, "rgba(180,40,20,0.11)")
    grd.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H)

    // orbit ellipses
    ctx.setLineDash([4, 8]); ctx.lineWidth = 0.5
    for (const a of list) {
      if (a.exitProgress >= 1) continue
      const rx = a.orbitRadiusX * Math.min(1, a.arrivalProgress)
      const ry = a.orbitRadiusY * Math.min(1, a.arrivalProgress)
      if (rx < 12) continue
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.stroke()
    }
    ctx.setLineDash([])

    // connector lines
    ctx.setLineDash([4, 6]); ctx.lineWidth = 0.5
    for (const a of list) {
      if (a.exitProgress >= 1) continue
      const fade = a.exitProgress > 0 ? 1 - a.exitProgress : 1
      const rx = a.orbitRadiusX * Math.min(1, a.arrivalProgress)
      const ry = a.orbitRadiusY * Math.min(1, a.arrivalProgress)
      const nx = cx + Math.cos(a.angle) * rx
      const ny = cy + Math.sin(a.angle) * ry
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny)
      ctx.strokeStyle = hexRgba(threatColor(a.threat_type), 0.09 * fade); ctx.stroke()
    }
    ctx.setLineDash([])

    // nodes
    for (const a of list) {
      if (a.exitProgress >= 1) continue
      const fade   = a.exitProgress > 0 ? 1 - a.exitProgress : 1
      const rx     = a.orbitRadiusX * Math.min(1, a.arrivalProgress)
      const ry     = a.orbitRadiusY * Math.min(1, a.arrivalProgress)
      const nx     = cx + Math.cos(a.angle) * rx
      const ny     = cy + Math.sin(a.angle) * ry
      const col    = threatColor(a.threat_type)
      const sel    = selRef.current === a.agent_id
      const nr     = sel ? 21 : 18

      ctx.globalAlpha = fade

      // glow
      ctx.beginPath(); ctx.arc(nx, ny, nr + 8, 0, Math.PI * 2)
      ctx.fillStyle = hexRgba(col, sel ? 0.38 : 0.14); ctx.fill()

      // fill
      ctx.beginPath(); ctx.arc(nx, ny, nr, 0, Math.PI * 2)
      ctx.fillStyle = hexRgba(col, 0.84); ctx.fill()

      // selection ring
      if (sel) {
        ctx.beginPath(); ctx.arc(nx, ny, nr + 5, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = 1.5; ctx.stroke()
      }

      // center dot
      ctx.beginPath(); ctx.arc(nx, ny, 3, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255,255,255,0.82)"; ctx.fill()

      ctx.globalAlpha = fade

      // label — show real agent name (truncated)
      const lbl = (a.name || a.agent_id).length > 11
        ? (a.name || a.agent_id).slice(0, 11) + "…"
        : (a.name || a.agent_id)
      ctx.font = "9px monospace"; ctx.textAlign = "center"
      ctx.fillStyle = `rgba(255,255,255,${0.52 * fade})`
      ctx.fillText(lbl, nx, ny + nr + 13)

      ctx.globalAlpha = 1
    }

    // pulse ring
    pulseRef.current.r += 0.26
    pulseRef.current.a = Math.max(0, 0.28 * (1 - (pulseRef.current.r - 80) / 30))
    if (pulseRef.current.r > 110) { pulseRef.current.r = 80; pulseRef.current.a = 0.28 }
    ctx.beginPath(); ctx.arc(cx, cy, pulseRef.current.r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(180,60,30,${pulseRef.current.a})`;  ctx.lineWidth = 1; ctx.stroke()

    // Tai Lung — outer ring
    ctx.beginPath(); ctx.arc(cx, cy, 54, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(140,30,10,0.15)"; ctx.fill()
    ctx.strokeStyle = "#b04020"; ctx.lineWidth = 1.5; ctx.stroke()

    // inner ring
    ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(100,20,8,0.3)"; ctx.fill()
    ctx.strokeStyle = "#c85030"; ctx.lineWidth = 1; ctx.stroke()

    // claw strokes
    ctx.strokeStyle = "#e06040"; ctx.lineWidth = 2; ctx.lineCap = "round"
    for (let i = 0; i < 3; i++) {
      const base = (i * Math.PI * 2) / 3 - Math.PI / 2
      const sx = cx + Math.cos(base) * 5,  sy = cy + Math.sin(base) * 5
      const ex = cx + Math.cos(base) * 26, ey = cy + Math.sin(base) * 26
      const cp = base + 0.42
      const cpx = cx + Math.cos(cp) * 17,  cpy = cy + Math.sin(cp) * 17
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(cpx, cpy, ex, ey); ctx.stroke()
    }
    ctx.lineCap = "butt"

    ctx.textAlign = "center"
    ctx.font = "11px monospace"; ctx.fillStyle = "#8a4030"
    ctx.fillText("TAI  LUNG", cx, cy + 72)
    ctx.font = "9px monospace"; ctx.fillStyle = "rgba(180,80,60,0.6)"
    ctx.fillText("ISOLATION CHAMBER ACTIVE", cx, cy + 86)

    rafRef.current = requestAnimationFrame(draw)
  }, [])

  // start loop + ResizeObserver
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const resize = () => {
      const p = cv.parentElement
      if (p) { cv.width = p.clientWidth; cv.height = p.clientHeight }
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (cv.parentElement) ro.observe(cv.parentElement)
    rafRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect() }
  }, [draw])

  // ── Canvas click — hit test ─────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current
    if (!cv) return
    const rect = cv.getBoundingClientRect()
    const sx = cv.width / rect.width, sy = cv.height / rect.height
    const mx = (e.clientX - rect.left) * sx
    const my = (e.clientY - rect.top)  * sy
    const cx = cv.width / 2, cy = cv.height / 2
    let hit: string | null = null
    for (const a of agentsRef.current) {
      if (a.exitProgress >= 1) continue
      const rx = a.orbitRadiusX * Math.min(1, a.arrivalProgress)
      const ry = a.orbitRadiusY * Math.min(1, a.arrivalProgress)
      const nx = cx + Math.cos(a.angle) * rx
      const ny = cy + Math.sin(a.angle) * ry
      if (Math.hypot(mx - nx, my - ny) < 32) { hit = a.agent_id; break }
    }
    setSelectedId(prev => prev === hit ? null : hit)
  }, [])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selAgent     = snapshot.find(a => a.agent_id === selectedId) || null
  const selActivity  = activity.filter(f => f.agent_id === selectedId)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`@keyframes hc-ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="flex overflow-hidden"
        style={{ height: "100%", width: "100%", background: "#0a0a0b", color: "#fff" }}
      >
        {/* ── LEFT: orbital arena ── */}
        <div className="flex-1 relative" style={{ minWidth: 0 }}>
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="absolute top-4 left-5 z-10"
          >
            <button
              className="font-mono text-[11px] tracking-[3px] uppercase transition-colors"
              style={{ color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)")}
              onClick={() => window.dispatchEvent(new CustomEvent("dragonNavigate", { detail: { section: "overview" } }))}
            >
              ← Back to Command Dashboard
            </button>
          </motion.div>

          {/* empty state overlay */}
          <AnimatePresence>
            {!loading && empty && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
              >
                <div style={{ fontFamily: "monospace", fontSize: "12px", color: "rgba(255,255,255,0.2)", textAlign: "center", letterSpacing: "2px" }}>
                  NO AGENTS IN ISOLATION
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.1)", marginTop: "6px" }}>
                  Trigger A7 or T6 to populate the chamber
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <canvas
            ref={canvasRef}
            onClick={handleClick}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "crosshair", display: "block" }}
          />
        </div>

        {/* ── RIGHT: detail panel ── */}
        <div
          className="flex flex-col overflow-y-auto"
          style={{ width: "380px", flexShrink: 0, background: "#111113", borderLeft: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* stats grid */}
          <motion.div
            className="grid grid-cols-2 gap-3 p-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } }, hidden: {} }}
          >
            {([
              { label: "AGENTS ISOLATED",       value: String(stats.isolated),       color: "#fff"     },
              { label: "REAL SYSTEM IMPACT",     value: "ZERO",                       color: "#10b981"  },
              { label: "FAKE RESPONSES SERVED",  value: String(stats.fake_responses), color: "#fff"     },
              { label: "AVG TIME IN CAGE",        value: fmtMs(stats.avg_time_ms),    color: "#fff"     },
            ] as const).map(card => (
              <motion.div
                key={card.label}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "12px 16px" }}
              >
                <div style={{ fontFamily: "monospace", fontSize: "22px", fontWeight: 500, color: card.color }}>
                  {card.value}
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                  {card.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "0 16px" }} />

          {/* agent detail */}
          <div className="flex-1 p-4">
            <AnimatePresence mode="wait">
              {selAgent ? (
                <motion.div
                  key={selAgent.agent_id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "16px" }}
                >
                  <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#ef4444", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>
                    ISOLATED AGENT
                  </div>

                  {/* name + id */}
                  <div style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "bold", marginBottom: "2px" }}>
                    {selAgent.name}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "10px" }}>
                    {selAgent.agent_id}
                  </div>

                  {/* threat badge */}
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", padding: "3px 10px",
                      borderRadius: "9999px",
                      background: hexRgba(threatColor(selAgent.threat_type), 0.15),
                      border: `1px solid ${hexRgba(threatColor(selAgent.threat_type), 0.5)}`,
                      color: threatColor(selAgent.threat_type),
                      fontSize: "11px", fontFamily: "monospace",
                    }}>
                      {selAgent.threat_type}
                    </span>
                    <span style={{ marginLeft: "8px", fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                      {selAgent.sector}
                    </span>
                  </div>

                  {/* time in cage (live) */}
                  <div style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "2px" }}>
                    TIME IN CAGE
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "20px", color: "#fff", marginBottom: "12px" }}>
                    {fmtIso(selAgent.isolated_at)}
                  </div>

                  <div style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
                    REASON
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "12px", lineHeight: 1.5 }}>
                    {selAgent.reason}
                  </div>

                  <div style={{ display: "flex", gap: "20px", marginBottom: "14px" }}>
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
                        RISK SCORE
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: "18px", color: selAgent.risk_score_at_isolation >= 90 ? "#ef4444" : "#d97706" }}>
                        {selAgent.risk_score_at_isolation}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
                        TRUST SCORE
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: "18px", color: selAgent.trust_score <= 10 ? "#ef4444" : "#d97706" }}>
                        {selAgent.trust_score}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
                    LAST ACTION ATTEMPTED
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "14px" }}>
                    {selAgent.last_action_attempted}
                  </div>

                  {/* honeypot activity feed for this agent */}
                  <div style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                    HONEYPOT ACTIVITY — {selAgent.fake_responses_served} events
                  </div>
                  <div style={{ maxHeight: "96px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px" }}>
                    <AnimatePresence initial={false}>
                      {selActivity.slice(0, 5).map(item => (
                        <motion.div
                          key={item.id || item.timestamp}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.18 }}
                          style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}
                        >
                          {new Date(item.timestamp).toLocaleTimeString()} → FAKE SUCCESS sent: {item.action}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {selActivity.length === 0 && (
                      <div style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.2)" }}>
                        No logged interactions yet
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "160px", color: "rgba(255,255,255,0.15)" }}
                >
                  <div style={{ fontFamily: "monospace", fontSize: "22px", marginBottom: "10px", letterSpacing: "-1px" }}>
                    +--+
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "12px", textAlign: "center" }}>
                    {loading ? "Loading chamber data…" : empty ? "No agents in isolation" : "Click an orbiting agent to inspect"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "0 16px" }} />

          {/* oracle scroll */}
          <div className="p-4" style={{ paddingBottom: "20px" }}>
            <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#d97706", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
              ORACLE SCROLL — PREDICTED NEXT VECTOR
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.35 }}
              style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "14px", marginBottom: "12px" }}
            >
              {oracle ? (
                <>
                  <div style={{ fontSize: "13px", color: "#fff", marginBottom: "10px", lineHeight: 1.55 }}>
                    {oracle.vector}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "2px 9px", borderRadius: "9999px",
                      background: "rgba(217,119,6,0.15)", border: "1px solid rgba(217,119,6,0.4)",
                      color: "#d97706", fontSize: "11px", fontFamily: "monospace",
                    }}>
                      {oracle.confidence}% confidence
                    </span>
                    <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)" }}>
                      {oracle.threat_type}
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: "12px", fontFamily: "monospace", color: "rgba(255,255,255,0.2)" }}>
                  Run Oracle Predict (A9) in MANTIS to generate a prediction
                </div>
              )}
            </motion.div>

            {/* ticker — CSS only, zero JS overhead */}
            <div style={{ overflow: "hidden", height: "16px" }}>
              <div
                style={{
                  display: "inline-block", whiteSpace: "nowrap",
                  fontFamily: "monospace", fontSize: "10px",
                  color: "rgba(255,255,255,0.2)",
                  animation: "hc-ticker 32s linear infinite",
                }}
              >
                {/* real threat types from current agents, repeated for seamless loop */}
                {(() => {
                  const types = snapshot.map(a => a.threat_type).join(" · ") || "INJECTION · BEHAVIOR · REPLAY · PRIVILEGE"
                  return (types + " · " + types + " · ")
                })()}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
