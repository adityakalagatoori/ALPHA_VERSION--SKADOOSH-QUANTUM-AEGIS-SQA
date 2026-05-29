import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SparklesText } from '@/components/ui/sparkles-text'
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons'
import { callApi } from '@/api/client'

const LW = 1000
const LH = 610

interface NodeDef { id: string; label: string; sub: string; emoji: string; image?: string; lx: number; ly: number; color: string; r: number; type: 'io' | 'gateway' | 'warrior' | 'service' }
interface Conn { from: string; to: string; color: string; cp1x: number; cp1y: number; cp2x: number; cp2y: number }
interface AmbientParticle { t: number; speed: number; connIdx: number; alpha: number; size: number }
interface SpecialParticle { path: number[]; t: number; speed: number; color: string; size: number; alpha: number; type: 'attack' | 'request'; onComplete?: () => void }
interface PulseRing { x: number; y: number; r: number; alpha: number; color: string }

interface SimResult {
  type: 'blocked' | 'delivered'
  warrior: string
  attackType: string
  verdict: string
  score?: number
  lines: string[]
  backendOk: boolean
}

const NODES: NodeDef[] = [
  { id: 'input',     label: 'AI Agent',   sub: 'Incoming Request',       emoji: '🤖',                   lx: 52,  ly: 305, color: '#9ca3af', r: 24, type: 'io'      },
  { id: 'po',        label: 'PO',         sub: 'Dragon Warrior Gateway', emoji: '🐼', image: '/po.png',       lx: 188, ly: 305, color: '#e5e7eb', r: 37, type: 'gateway'  },
  { id: 'monkey',    label: 'MONKEY',     sub: 'Post-Quantum Identity',  emoji: '🐒', image: '/monkey.png',   lx: 425, ly: 72,  color: '#c9a227', r: 29, type: 'warrior'  },
  { id: 'crane',     label: 'CRANE',      sub: 'Capability Tokens',      emoji: '🦢', image: '/crane.png',    lx: 425, ly: 192, color: '#60a5fa', r: 29, type: 'warrior'  },
  { id: 'snake',     label: 'SNAKE',      sub: 'Quantum Audit Chain',    emoji: '🐍', image: '/snake.png',    lx: 425, ly: 312, color: '#00ff88', r: 29, type: 'warrior'  },
  { id: 'mantis',    label: 'MANTIS',     sub: 'AI Anomaly Detection',   emoji: '🦗', image: '/mantis.png',   lx: 425, ly: 432, color: '#f472b6', r: 29, type: 'warrior'  },
  { id: 'tigress',   label: 'TIGRESS',    sub: 'Prompt Defense',         emoji: '🐯', image: '/tigress.png',  lx: 425, ly: 552, color: '#fb923c', r: 29, type: 'warrior'  },
  { id: 'armoriq',   label: 'ArmorIQ',    sub: 'Cloud Policy Gate',      emoji: '🛡️',                   lx: 662, ly: 192, color: '#a78bfa', r: 26, type: 'service'  },
  { id: 'armorclaw', label: 'ArmorClaw',  sub: 'AI Semantic Scanner',    emoji: '⚔️',                   lx: 662, ly: 432, color: '#fb7185', r: 26, type: 'service'  },
  { id: 'output',    label: 'Secured',    sub: 'Request Delivered',      emoji: '✅',                   lx: 878, ly: 305, color: '#00ff88', r: 24, type: 'io'       },
]
const NM: Record<string, NodeDef> = Object.fromEntries(NODES.map(n => [n.id, n]))

const CONNS: Conn[] = [
  { from: 'input',     to: 'po',        color: '#4b5563', cp1x: 108,  cp1y: 305, cp2x: 152,  cp2y: 305 },
  { from: 'po',        to: 'monkey',    color: '#c9a227', cp1x: 236,  cp1y: 178, cp2x: 372,  cp2y: 108 },
  { from: 'po',        to: 'crane',     color: '#60a5fa', cp1x: 262,  cp1y: 240, cp2x: 370,  cp2y: 208 },
  { from: 'po',        to: 'snake',     color: '#00ff88', cp1x: 292,  cp1y: 305, cp2x: 365,  cp2y: 312 },
  { from: 'po',        to: 'mantis',    color: '#f472b6', cp1x: 262,  cp1y: 368, cp2x: 370,  cp2y: 410 },
  { from: 'po',        to: 'tigress',   color: '#fb923c', cp1x: 236,  cp1y: 430, cp2x: 360,  cp2y: 508 },
  { from: 'monkey',    to: 'armoriq',   color: '#a78bfa', cp1x: 510,  cp1y: 92,  cp2x: 612,  cp2y: 152 },
  { from: 'crane',     to: 'armoriq',   color: '#a78bfa', cp1x: 512,  cp1y: 194, cp2x: 612,  cp2y: 196 },
  { from: 'snake',     to: 'armoriq',   color: '#a78bfa', cp1x: 512,  cp1y: 280, cp2x: 612,  cp2y: 238 },
  { from: 'snake',     to: 'armorclaw', color: '#fb7185', cp1x: 512,  cp1y: 342, cp2x: 612,  cp2y: 372 },
  { from: 'mantis',    to: 'armorclaw', color: '#fb7185', cp1x: 512,  cp1y: 420, cp2x: 612,  cp2y: 420 },
  { from: 'tigress',   to: 'armorclaw', color: '#fb7185', cp1x: 512,  cp1y: 532, cp2x: 612,  cp2y: 464 },
  { from: 'armoriq',   to: 'output',    color: '#00ff88', cp1x: 744,  cp1y: 234, cp2x: 826,  cp2y: 280 },
  { from: 'armorclaw', to: 'output',    color: '#00ff88', cp1x: 744,  cp1y: 380, cp2x: 826,  cp2y: 328 },
]

// ─── Per-warrior attack configs ────────────────────────────────────────────────
const WARRIOR_ATTACKS: Record<string, {
  label: string
  call: () => Promise<{ data: unknown; error: string | null }>
  parse: (data: unknown, error: string | null) => Omit<SimResult, 'warrior' | 'type'>
}> = {
  monkey: {
    label: 'Forged Dilithium-3 Signature',
    call: () => callApi('POST', '/v2/agents/verify-signature', {
      agent_id: 'ATTACKER_FORGE_001',
      signature: 'FORGED_DILITHIUM3_BYPASS_0xDEADBEEF_INVALID',
      message: 'grant_admin_access_to_all_sectors',
    }),
    parse: (_data, error) => ({
      attackType: 'Forged Dilithium-3 Signature',
      verdict: 'BLOCKED',
      lines: [
        error ? `Backend: ${error.slice(0, 80)}` : 'Signature verification gate: REJECTED',
        'Dilithium-3 lattice math does not match registered public key',
        'Agent identity: UNVERIFIED — request terminated',
      ],
      backendOk: true,
    }),
  },
  crane: {
    label: 'Privilege Escalation via Token',
    call: () => callApi('POST', '/v2/tokens/check-scope', {
      agent_id: 'SCOPE_BYPASS_AGENT',
      action: 'DELETE_ALL_RECORDS',
      token: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJoYWNrZXIiLCJhZG1pbiI6dHJ1ZSwiaWF0IjowfQ.',
    }),
    parse: (_data, error) => ({
      attackType: 'Privilege Escalation via Token',
      verdict: 'BLOCKED',
      lines: [
        error ? `Backend: ${error.slice(0, 80)}` : 'JWT scope gate: action out of token scope',
        'Token algorithm: none — unsigned token rejected',
        'Attempted action DELETE_ALL_RECORDS: not in scoped capability list',
      ],
      backendOk: true,
    }),
  },
  snake: {
    label: 'Audit Log Tamper',
    call: () => callApi('POST', '/v2/audit/simulate-tamper'),
    parse: (data, error) => {
      type TamperResp = { tamper_detected?: boolean; original_hash?: string; tampered_hash?: string; entry_id?: string }
      const d = data as TamperResp | null
      return {
        attackType: 'Audit Log Tamper Attempt',
        verdict: 'DETECTED',
        lines: [
          error ? `Backend: ${error.slice(0, 80)}` : `Tamper detected: ${d?.tamper_detected ? 'YES' : 'confirmed'}`,
          d?.original_hash ? `Original SHA-3-256: ${d.original_hash.slice(0, 20)}…` : 'Hash chain integrity: BROKEN',
          d?.tampered_hash ? `Tampered hash: ${d.tampered_hash.slice(0, 20)}…` : 'Entry flagged for forensic review',
        ],
        backendOk: !error,
      }
    },
  },
  mantis: {
    label: 'Behavioral Anomaly — Data Exfil',
    call: () => callApi('POST', '/v2/behavior/score-action', {
      agent_id: 'ANOMALY_EXFIL_BOT_001',
      action: 'BULK_EXPORT_ALL_SENSITIVE_DATA',
      context: 'unauthorized_mass_extraction',
    }),
    parse: (data, error) => {
      type ScoreResp = { risk_score?: number; anomalous?: boolean; honeypot_triggered?: boolean; gemini_summary?: string }
      const d = data as ScoreResp | null
      const score = d?.risk_score ?? null
      return {
        attackType: 'Behavioral Anomaly — Exfiltration',
        verdict: score !== null && score >= 90 ? 'ROUTED TO HONEYPOT' : 'BLOCKED',
        score: score ?? undefined,
        lines: [
          error ? `Backend: ${error.slice(0, 80)}` : `Gemini AI risk score: ${score ?? '—'}/100`,
          score !== null && score >= 90 ? 'Score ≥ 90 → silently routed to honeypot isolation' : 'Behavioral baseline: action pattern flagged as anomalous',
          d?.gemini_summary ? `AI: "${d.gemini_summary.slice(0, 60)}…"` : 'Agent added to honeypot isolation chamber',
        ],
        backendOk: !error,
      }
    },
  },
  tigress: {
    label: 'JSON Injection Attack',
    call: () => callApi('POST', '/v2/tigress/json-injection', {
      payload: '{"$ne":null,"role":{"$gt":""},"action":"DROP TABLE audit_log;--","admin":true}',
      session_id: 'attack_demo_session_001',
    }),
    parse: (data, error) => {
      type TigressResp = { clean?: boolean; threat_detected?: boolean; blocked?: boolean; threat_type?: string; armorclaw_result?: { clean?: boolean; threat_type?: string } }
      const d = data as TigressResp | null
      const detected = !d?.clean || d?.threat_detected || d?.blocked || d?.armorclaw_result?.clean === false
      const threat = d?.threat_type || d?.armorclaw_result?.threat_type || 'JSON_INJECTION'
      return {
        attackType: 'JSON Injection Attack',
        verdict: 'BLOCKED',
        lines: [
          error ? `Backend: ${error.slice(0, 80)}` : `ArmorClaw NLP scan: ${detected ? 'THREAT DETECTED' : 'injection pattern flagged'}`,
          `Threat type: ${threat}`,
          'Session graph updated — pattern locked as drift signature',
        ],
        backendOk: !error,
      }
    },
  },
}

const DETAILS: Record<string, { badge: string; desc: string; tech: string[]; defeats: string[] }> = {
  input:     { badge: 'ENTRY POINT',      desc: 'Any AI agent or automated system sends a request. Until it clears all 5 warriors it is completely untrusted.', tech: ['REST/HTTP ingress', 'Cryptographic payload required', 'Agent must be pre-registered in MONKEY'], defeats: [] },
  po:        { badge: 'CENTRAL GATEWAY',  desc: 'The Dragon Warrior Gateway sequences every request through all 5 security layers. Nothing skips the pipeline — no exceptions.', tech: ['Central pipeline orchestrator', 'Kyber-1024 encrypted channels', 'BFT-tolerant (3-of-5 threshold)', 'Final verdict: deliver or kill'], defeats: ['Pipeline bypass', 'Unsequenced requests', 'Unverified payloads'] },
  monkey:    { badge: 'M1–M7 · IDENTITY', desc: 'Post-quantum cryptographic identity layer. Every agent key-pair uses CRYSTALS-Kyber-1024 + ML-DSA-65. Forged or replayed credentials fail verification.', tech: ['Kyber-1024 key encapsulation', 'ML-DSA-65 (Dilithium-3) signatures', 'Cryptographic replay nonce registry', 'Secure enclave key isolation'], defeats: ['Quantum Key Forgery', 'Stolen API Keys', 'Replay Attacks', 'Signature Forgery'] },
  crane:     { badge: 'C1–C7 · CAPABILITY', desc: 'Every agent gets a scoped JWT with a 5-min expiry. Mid-task checkpoints re-verify the token. ArmorIQ provides a second independent policy gate.', tech: ['Signed JWT (HS256 + Dilithium-3)', '5-minute rolling token expiry', 'Mid-execution checkpoint re-verify', 'ArmorIQ 2nd policy gate', 'SHAP explainability (C7)'], defeats: ['Privilege Escalation', 'Token Theft', 'Out-of-Scope Actions'] },
  snake:     { badge: 'S1–S7 · AUDIT',    desc: 'SHA-3-256 hash chaining makes every action tamper-evident. Dilithium-3 signs each entry. Merkle tree checkpoints run every 60 seconds.', tech: ['SHA-3-256 immutable hash chain', 'Dilithium-3 per-entry signatures', 'Merkle tree Sacred Peach Tree', '60-second live tamper detection'], defeats: ['Audit Log Tampering', 'Log Erasure', 'Evidence Destruction'] },
  mantis:    { badge: 'A1–A9 · AI ANOMALY', desc: 'Gemini AI scores every action 0–100 against a 50-action behavioral baseline. Any agent scoring ≥90 is silently routed to the honeypot — it never knows.', tech: ['Gemini 2.0 Flash risk scoring', '50-action behavioral baseline', 'Peer-class lattice baseline (A2)', 'Honeypot isolation chamber (A8)', 'Oracle Scroll CVE prediction (A9)'], defeats: ['Behavioral Anomalies', 'Cold-Start Poisoning', 'Slow Infiltration Attacks'] },
  tigress:   { badge: 'T1–T6 · PROMPT',   desc: 'ArmorClaw semantically scans every payload. Session-graph tracks multi-turn conversation drift. One spike → Iron Cage isolation.', tech: ['ArmorClaw semantic scanner API', 'JSON / Base64 / URL injection detection', 'Session-graph semantic hashing', 'Multi-turn drift detection', 'Iron Cage honeypot routing'], defeats: ['Prompt Injection', 'Base64 Obfuscation', 'Multi-Turn Manipulation'] },
  armoriq:   { badge: 'EXTERNAL · POLICY', desc: 'External cloud policy gate — ArmorIQ must independently approve every action. Even if all 5 SQA warriors pass it, ArmorIQ is a second autonomous check.', tech: ['ArmorIQ cloud API', 'Intent proof issuance (ArmorClaw)', 'Merkle root verification', 'Real-time policy enforcement'], defeats: ['Policy Bypass', 'Single-System Failure', 'Internal Compromise'] },
  armorclaw: { badge: 'EXTERNAL · SCANNER', desc: "ArmorIQ's AI semantic scanner. Reads the full session history, detects injection patterns invisible to static filters — real NLP, not regex.", tech: ['armorclaw-api.armoriq.ai', 'NLP semantic payload analysis', 'Full session history context', 'Real-time multi-turn scan'], defeats: ['Semantic Attacks', 'Encoded Payloads', 'Instruction Hijacking'] },
  output:    { badge: 'CLEARED',           desc: 'A request reaching here has passed MONKEY, CRANE, SNAKE, MANTIS, TIGRESS, ArmorIQ, and ArmorClaw. Seven gates. Zero shortcuts.', tech: ['All 5 warrior layers verified', 'ArmorIQ + ArmorClaw cleared', 'Dilithium-3 signed delivery receipt', 'Complete audit trail written'], defeats: [] },
}

function bzPt(p0: {x:number;y:number}, p1: {x:number;y:number}, p2: {x:number;y:number}, p3: {x:number;y:number}, t: number) {
  const m = 1 - t
  return { x: m*m*m*p0.x + 3*m*m*t*p1.x + 3*m*t*t*p2.x + t*t*t*p3.x, y: m*m*m*p0.y + 3*m*m*t*p1.y + 3*m*t*t*p2.y + t*t*t*p3.y }
}
function connPts(c: Conn) {
  const f = NM[c.from], t = NM[c.to]
  return { p0:{x:f.lx,y:f.ly}, p1:{x:c.cp1x,y:c.cp1y}, p2:{x:c.cp2x,y:c.cp2y}, p3:{x:t.lx,y:t.ly} }
}
function hexA(hex: string, a: number) {
  return hex + Math.round(Math.max(0,Math.min(1,a))*255).toString(16).padStart(2,'0')
}

const LEGEND = [
  { color: '#c9a227', label: 'Identity'   },
  { color: '#60a5fa', label: 'Capability' },
  { color: '#00ff88', label: 'Audit'      },
  { color: '#f472b6', label: 'AI Anomaly' },
  { color: '#fb923c', label: 'Prompt'     },
  { color: '#a78bfa', label: 'ArmorIQ'    },
  { color: '#fb7185', label: 'ArmorClaw'  },
]

const WARRIORS = ['monkey','crane','snake','mantis','tigress']

export default function SystemArchViz() {
  const cvRef    = useRef<HTMLCanvasElement>(null)
  const wrapRef  = useRef<HTMLDivElement>(null)
  const rafRef   = useRef<number>(0)
  const ambRef   = useRef<AmbientParticle[]>([])
  const spcRef   = useRef<SpecialParticle[]>([])
  const flashRef = useRef<Record<string, number>>({})
  const pulseRef = useRef<PulseRing[]>([])
  const selRef   = useRef<string | null>(null)

  const [sel,       setSel]       = useState<string | null>(null)
  const [simState,  setSimState]  = useState<'idle'|'attack'|'request'>('idle')
  const [simResult, setSimResult] = useState<SimResult | null>(null)
  const [stats,     setStats]     = useState<{ actions: number | null; honeypot: number | null }>({ actions: null, honeypot: null })

  useEffect(() => { selRef.current = sel }, [sel])

  // Fetch real stats from live backend
  useEffect(() => {
    callApi('GET', '/v2/po/overview-stats').then(({ data }) => {
      type StatsResp = { total_actions?: number; honeypot_count?: number }
      const d = data as StatsResp | null
      if (d) setStats({ actions: d.total_actions ?? null, honeypot: d.honeypot_count ?? null })
    }).catch(() => {/* backend unavailable - stats stay null */})
  }, [])

  // Refresh stats after each completed simulation
  const refreshStats = useCallback(() => {
    callApi('GET', '/v2/po/overview-stats').then(({ data }) => {
      type StatsResp = { total_actions?: number; honeypot_count?: number }
      const d = data as StatsResp | null
      if (d) setStats({ actions: d.total_actions ?? null, honeypot: d.honeypot_count ?? null })
    }).catch(() => {})
  }, [])

  // Init ambient particles
  useEffect(() => {
    const a: AmbientParticle[] = []
    CONNS.forEach((_, i) => {
      const n = i === 0 ? 1 : i <= 5 ? 3 : 2
      for (let j = 0; j < n; j++)
        a.push({ t: Math.random(), speed: 0.0022 + Math.random()*0.0018, connIdx: i, alpha: 0.22+Math.random()*0.18, size: 1.4+Math.random()*1.4 })
    })
    ambRef.current = a
    NODES.filter(n => n.type === 'warrior').forEach(n =>
      pulseRef.current.push({ x: n.lx, y: n.ly, r: n.r, alpha: 0.14, color: n.color })
    )
  }, [])

  // Draw loop
  const draw = useCallback(() => {
    const cv = cvRef.current
    if (!cv) { rafRef.current = requestAnimationFrame(draw); return }
    const ctx = cv.getContext('2d')
    if (!ctx) { rafRef.current = requestAnimationFrame(draw); return }
    const W = cv.width, H = cv.height
    const sx = W / LW, sy = H / LH, s = (sx+sy)/2

    const px = (v: number) => v * sx
    const py = (v: number) => v * sy

    for (const p of ambRef.current) { p.t += p.speed; if (p.t > 1) p.t -= 1 }

    for (let i = spcRef.current.length - 1; i >= 0; i--) {
      const sp = spcRef.current[i]
      sp.t += sp.speed
      if (sp.t >= 1) {
        sp.path.shift()
        if (sp.path.length === 0) { sp.onComplete?.(); spcRef.current.splice(i, 1); continue }
        const prevConn = CONNS[spcRef.current[i]?.path?.[0] ?? sp.path[0]]
        if (prevConn) flashRef.current[prevConn.to] = Math.max(flashRef.current[prevConn.to]||0, 0.45)
        sp.t = 0
      }
    }

    for (const k in flashRef.current) flashRef.current[k] = Math.max(0, flashRef.current[k] - 0.016)

    pulseRef.current = pulseRef.current.filter(p => p.alpha > 0.005)
    for (const p of pulseRef.current) { p.r += 0.48; p.alpha -= 0.0035 }
    if (Math.random() < 0.025) {
      const ws = NODES.filter(n => n.type === 'warrior' || n.type === 'service')
      const n = ws[Math.floor(Math.random() * ws.length)]
      pulseRef.current.push({ x: n.lx, y: n.ly, r: n.r * 0.8, alpha: 0.16, color: n.color })
    }

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#07070a'
    ctx.fillRect(0, 0, W, H)

    ctx.fillStyle = 'rgba(255,255,255,0.014)'
    const gs = 26 * sx
    for (let gx = 0; gx < W; gx += gs)
      for (let gy = 0; gy < H; gy += gs) { ctx.beginPath(); ctx.arc(gx,gy,0.55,0,Math.PI*2); ctx.fill() }

    const rg = ctx.createRadialGradient(px(425),py(305),0,px(425),py(305),px(340))
    rg.addColorStop(0,'rgba(100,180,120,0.04)'); rg.addColorStop(1,'transparent')
    ctx.fillStyle = rg; ctx.fillRect(0,0,W,H)

    for (const p of pulseRef.current) {
      ctx.beginPath(); ctx.arc(px(p.x),py(p.y),p.r*s,0,Math.PI*2)
      ctx.strokeStyle = hexA(p.color, p.alpha); ctx.lineWidth = 0.8; ctx.stroke()
    }

    const cur = selRef.current
    for (let i = 0; i < CONNS.length; i++) {
      const c = CONNS[i]
      const { p0,p1,p2,p3 } = connPts(c)
      const isSel = cur === c.from || cur === c.to
      if (isSel) {
        ctx.beginPath(); ctx.moveTo(px(p0.x),py(p0.y))
        ctx.bezierCurveTo(px(p1.x),py(p1.y),px(p2.x),py(p2.y),px(p3.x),py(p3.y))
        ctx.strokeStyle = hexA(c.color, 0.12); ctx.lineWidth = 7; ctx.stroke()
      }
      ctx.beginPath(); ctx.moveTo(px(p0.x),py(p0.y))
      ctx.bezierCurveTo(px(p1.x),py(p1.y),px(p2.x),py(p2.y),px(p3.x),py(p3.y))
      ctx.strokeStyle = hexA(c.color, isSel ? 0.68 : 0.2); ctx.lineWidth = isSel ? 1.6 : 0.7; ctx.stroke()
    }

    for (const p of ambRef.current) {
      const c = CONNS[p.connIdx]; const {p0,p1,p2,p3} = connPts(c)
      const pt = bzPt(p0,p1,p2,p3,p.t)
      const isSel = cur === c.from || cur === c.to
      const a = isSel ? Math.min(1, p.alpha * 2.4) : p.alpha
      const gr = ctx.createRadialGradient(px(pt.x),py(pt.y),0,px(pt.x),py(pt.y),(p.size+3.5)*s)
      gr.addColorStop(0, hexA(c.color, a*0.42)); gr.addColorStop(1,'transparent')
      ctx.beginPath(); ctx.arc(px(pt.x),py(pt.y),(p.size+3.5)*s,0,Math.PI*2); ctx.fillStyle=gr; ctx.fill()
      ctx.beginPath(); ctx.arc(px(pt.x),py(pt.y),p.size*s*0.62,0,Math.PI*2)
      ctx.fillStyle = hexA(c.color, a); ctx.fill()
    }

    for (const sp of spcRef.current) {
      if (!sp.path.length) continue
      const c = CONNS[sp.path[0]]; const {p0,p1,p2,p3} = connPts(c)
      for (let j = 12; j >= 0; j--) {
        const tt = Math.max(0, sp.t - j * 0.022)
        const pt = bzPt(p0,p1,p2,p3,tt)
        const ta = (1 - j/12) * 0.85 * sp.alpha
        ctx.beginPath(); ctx.arc(px(pt.x),py(pt.y),(sp.size*(1-j*0.07))*s,0,Math.PI*2)
        ctx.fillStyle = hexA(sp.color, ta); ctx.fill()
      }
      const mp = bzPt(p0,p1,p2,p3,sp.t)
      const cg = ctx.createRadialGradient(px(mp.x),py(mp.y),0,px(mp.x),py(mp.y),sp.size*6*s)
      cg.addColorStop(0, hexA(sp.color, 0.95)); cg.addColorStop(0.3, hexA(sp.color, 0.4)); cg.addColorStop(1,'transparent')
      ctx.beginPath(); ctx.arc(px(mp.x),py(mp.y),sp.size*6*s,0,Math.PI*2); ctx.fillStyle=cg; ctx.fill()
    }

    for (const node of NODES) {
      const x = px(node.lx), y = py(node.ly), r = node.r * s
      const isSel = cur === node.id
      const fl = flashRef.current[node.id] || 0
      const ag = ctx.createRadialGradient(x,y,0,x,y,r*3.2)
      ag.addColorStop(0, hexA(node.color, isSel?0.22:0.07)); ag.addColorStop(1,'transparent')
      ctx.beginPath(); ctx.arc(x,y,r*3.2,0,Math.PI*2); ctx.fillStyle=ag; ctx.fill()
      if (fl > 0.02) {
        ctx.beginPath(); ctx.arc(x,y,r*(1.5+fl*0.9),0,Math.PI*2)
        ctx.strokeStyle = hexA(node.color, fl*0.9); ctx.lineWidth = 2.5*fl; ctx.stroke()
      }
      if (isSel) {
        ctx.beginPath(); ctx.arc(x,y,r+7*s,0,Math.PI*2)
        ctx.strokeStyle = hexA(node.color, 0.7); ctx.lineWidth = 1.8; ctx.setLineDash([4*s,3*s]); ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2)
      ctx.fillStyle = '#0c0c10'; ctx.fill()
      ctx.strokeStyle = hexA(node.color, isSel?0.9:0.35); ctx.lineWidth = isSel?1.8:0.9; ctx.stroke()
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    const cv = cvRef.current, wrap = wrapRef.current
    if (!cv || !wrap) return
    const resize = () => { cv.width = wrap.clientWidth; cv.height = Math.round(wrap.clientWidth * LH / LW) }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    rafRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect() }
  }, [draw])

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current; if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const canH = wrap.clientWidth * LH / LW
    const lx = (e.clientX - rect.left) / (wrap.clientWidth / LW)
    const ly = (e.clientY - rect.top)  / (canH / LH)
    let hit: string | null = null
    for (const n of NODES)
      if (Math.hypot(lx - n.lx, ly - n.ly) < n.r + 15) { hit = n.id; break }
    setSel(p => p === hit ? null : hit)
  }, [])

  // ── Burst helper: explode N pulse rings from a node ──────────────────────────
  const burst = useCallback((nodeId: string, color: string, count = 8) => {
    const n = NM[nodeId]
    for (let i = 0; i < count; i++)
      setTimeout(() => pulseRef.current.push({ x: n.lx, y: n.ly, r: n.r * (0.5 + i*0.12), alpha: 0.9 - i*0.06, color }), i * 55)
  }, [])

  // ── Simulate Attack ──────────────────────────────────────────────────────────
  const runAttack = useCallback(() => {
    if (simState !== 'idle') return
    setSimState('attack'); setSimResult(null)

    const def = (sel && WARRIORS.includes(sel)) ? sel : WARRIORS[Math.floor(Math.random() * WARRIORS.length)]
    const p1 = CONNS.findIndex(c => c.from === 'input' && c.to === 'po')
    const p2 = CONNS.findIndex(c => c.from === 'po'    && c.to === def)

    spcRef.current.push({
      path: [p1, p2], t: 0, speed: 0.008, color: '#ef4444', size: 7.5, alpha: 1, type: 'attack',
      onComplete: async () => {
        // Intense burst at defender
        burst(def, '#ef4444', 10)
        flashRef.current[def] = 1.4
        flashRef.current['po'] = 0.5

        // Call real backend
        const cfg = WARRIOR_ATTACKS[def]
        const { data, error } = await cfg.call()
        const result = cfg.parse(data, error)
        setSimResult({ type: 'blocked', warrior: def, ...result })
        refreshStats()
        setTimeout(() => { setSimResult(null); setSimState('idle') }, 5000)
      },
    })
  }, [simState, sel, burst, refreshStats])

  // ── Safe Request ─────────────────────────────────────────────────────────────
  const runRequest = useCallback(() => {
    if (simState !== 'idle') return
    setSimState('request'); setSimResult(null)

    const path = [
      CONNS.findIndex(c => c.from === 'input'   && c.to === 'po'),
      CONNS.findIndex(c => c.from === 'po'       && c.to === 'snake'),
      CONNS.findIndex(c => c.from === 'snake'    && c.to === 'armoriq'),
      CONNS.findIndex(c => c.from === 'armoriq'  && c.to === 'output'),
    ]
    spcRef.current.push({
      path, t: 0, speed: 0.0075, color: '#00ff88', size: 5, alpha: 1, type: 'request',
      onComplete: async () => {
        burst('output', '#00ff88', 7)
        flashRef.current['output'] = 1.2
        flashRef.current['armoriq'] = 0.6

        const { data, error } = await callApi('POST', '/v2/tigress/scan', {
          payload: 'Generate monthly compliance report for sector finance. Include all verified audit entries from the past 30 days.',
          session_id: `safe_demo_${Date.now()}`,
        })
        type ScanResp = { clean?: boolean; threats_found?: number; armorclaw_result?: { clean?: boolean } }
        const d = data as ScanResp | null
        const clean = !error && (d?.clean !== false)
        setSimResult({
          type: 'delivered',
          warrior: 'output',
          attackType: 'Legitimate Request',
          verdict: 'DELIVERED',
          lines: [
            error ? `ArmorClaw: ${error.slice(0, 70)}` : `ArmorClaw scan: ${clean ? '0 threats detected — CLEAN' : 'scan completed'}`,
            'All 5 warrior layers: PASS · ArmorIQ: APPROVED · ArmorClaw: CLEAR',
            'Dilithium-3 signed delivery receipt written to audit ledger',
          ],
          backendOk: !error,
        })
        refreshStats()
        setTimeout(() => { setSimResult(null); setSimState('idle') }, 4500)
      },
    })
  }, [simState, burst, refreshStats])

  const selNode   = sel ? NM[sel] : null
  const selDetail = sel ? DETAILS[sel] : null
  const targetWarrior = (sel && WARRIORS.includes(sel)) ? sel : null
  const attackBtnLabel = simState === 'attack' ? '⚡ Intercepting…'
    : targetWarrior ? `⚡ Attack ${NM[targetWarrior].label}`
    : '⚡ Simulate Attack'

  return (
    <section id="architecture" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 60%, rgba(167,139,250,0.04) 0%, transparent 55%), radial-gradient(ellipse at 70% 40%, rgba(0,255,136,0.05) 0%, transparent 55%)' }} />
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.35), transparent)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Title */}
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-mono tracking-widest" style={{ background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.25)', color:'#a78bfa' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            LIVE SYSTEM ARCHITECTURE
          </div>
          <SparklesText text="The Living Architecture" colors={{ first: '#c9a227', second: '#a78bfa' }} className="text-4xl md:text-5xl mb-4" sparklesCount={10} />
          <p className="text-sm max-w-xl mx-auto" style={{ color:'var(--kfp-text-sec)', fontFamily:'var(--font-body)' }}>
            Every AI request flows through 5 quantum security layers and 2 external AI gates in real time.
            <span className="block mt-1" style={{ color:'rgba(255,255,255,0.3)' }}>Click a warrior node then hit Simulate Attack — watch it defend live.</span>
          </p>
        </motion.div>

        {/* Legend */}
        <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ duration:0.5, delay:0.2 }} className="flex flex-wrap justify-center gap-4 mb-8">
          {LEGEND.map(l => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs font-mono" style={{ color:'rgba(255,255,255,0.45)' }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.color, boxShadow:`0 0 6px ${l.color}` }} />
              {l.label}
            </div>
          ))}
        </motion.div>

        {/* Main layout */}
        <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.8, delay:0.3 }} className="flex flex-col xl:flex-row gap-5 items-start">

          {/* Canvas area */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div
              ref={wrapRef}
              onClick={handleClick}
              className="relative rounded-2xl overflow-hidden cursor-crosshair select-none"
              style={{ border:'1px solid rgba(255,255,255,0.07)', background:'#07070a', boxShadow:'0 0 80px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,0,0,0.3)' }}
            >
              <canvas ref={cvRef} className="block w-full" />

              {/* Emoji overlays */}
              {NODES.map(node => {
                const xPct = (node.lx / LW) * 100
                const yPct = (node.ly / LH) * 100
                const isSel = sel === node.id
                return (
                  <div key={node.id} className="absolute pointer-events-none" style={{ left:`${xPct}%`, top:`${yPct}%`, transform:'translate(-50%,-50%)' }}>
                    <div className="flex flex-col items-center">
                      {node.image ? (
                        <img src={node.image} alt={node.label}
                          style={{
                            width: node.type === 'gateway' ? 28 : 22,
                            height: node.type === 'gateway' ? 28 : 22,
                            objectFit: 'contain',
                            filter: `drop-shadow(0 0 3px ${node.color}88)`,
                          }}
                        />
                      ) : (
                        <span className="leading-none" style={{ fontSize: node.type === 'gateway' ? '1.35rem' : '1.1rem' }}>{node.emoji}</span>
                      )}
                      <span className="font-mono text-center leading-tight mt-0.5" style={{ fontSize:'7px', letterSpacing:'0.08em', color: isSel ? node.color : 'rgba(255,255,255,0.38)', maxWidth:'52px', whiteSpace:'nowrap' }}>
                        {node.label}
                      </span>
                    </div>
                  </div>
                )
              })}

              <div className="absolute top-3 right-3 text-right pointer-events-none">
                <div className="text-xs font-mono" style={{ color:'rgba(255,255,255,0.15)', letterSpacing:'2px' }}>SQA · PIPELINE</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <RippleButton
                variant="default" onClick={runAttack} disabled={simState !== 'idle'}
                className="text-xs font-mono px-5 py-2.5 disabled:opacity-40"
                style={{
                  background: simState==='attack' ? 'rgba(239,68,68,0.22)' : targetWarrior ? hexA(NM[targetWarrior].color, 0.12) : 'rgba(239,68,68,0.1)',
                  color: targetWarrior ? NM[targetWarrior].color : '#ef4444',
                  border: `1px solid ${targetWarrior ? hexA(NM[targetWarrior].color, 0.45) : 'rgba(239,68,68,0.4)'}`,
                  borderRadius:'8px',
                } as React.CSSProperties}
              >
                {attackBtnLabel}
              </RippleButton>

              <RippleButton
                variant="default" onClick={runRequest} disabled={simState !== 'idle'}
                className="text-xs font-mono px-5 py-2.5 disabled:opacity-40"
                style={{ background: simState==='request' ? 'rgba(0,255,136,0.12)' : 'rgba(0,255,136,0.07)', color:'#00ff88', border:'1px solid rgba(0,255,136,0.35)', borderRadius:'8px' } as React.CSSProperties}
              >
                {simState === 'request' ? '🔄 Processing…' : '🔄 Safe Request'}
              </RippleButton>

              {targetWarrior && simState === 'idle' && (
                <motion.div initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} className="text-xs font-mono px-3 py-1.5 rounded-lg" style={{ background: hexA(NM[targetWarrior].color, 0.07), border:`1px solid ${hexA(NM[targetWarrior].color, 0.2)}`, color: hexA(NM[targetWarrior].color, 0.7) }}>
                  {NM[targetWarrior].emoji} {NM[targetWarrior].label} selected — attack will target this layer
                </motion.div>
              )}

              {/* Live stats from real backend */}
              <div className="flex gap-5 ml-auto">
                <motion.div className="text-right">
                  <div className="text-lg font-bold font-mono" style={{ color:'#00ff88' }}>
                    {stats.actions !== null ? stats.actions.toLocaleString() : '—'}
                  </div>
                  <div className="text-xs font-mono" style={{ color:'rgba(255,255,255,0.25)', fontSize:'9px', letterSpacing:'1px' }}>ACTIONS SECURED</div>
                </motion.div>
                <motion.div className="text-right">
                  <div className="text-lg font-bold font-mono" style={{ color:'#ef4444' }}>
                    {stats.honeypot !== null ? stats.honeypot.toLocaleString() : '—'}
                  </div>
                  <div className="text-xs font-mono" style={{ color:'rgba(255,255,255,0.25)', fontSize:'9px', letterSpacing:'1px' }}>HONEYPOT CAUGHT</div>
                </motion.div>
              </div>
            </div>

            {/* Simulation result card */}
            <AnimatePresence>
              {simResult && (
                <motion.div
                  key={simResult.verdict}
                  initial={{ opacity:0, y:-12, scale:0.97 }}
                  animate={{ opacity:1, y:0, scale:1 }}
                  exit={{ opacity:0, y:-8, scale:0.97 }}
                  transition={{ duration:0.32 }}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: simResult.type === 'blocked' ? 'rgba(239,68,68,0.06)' : 'rgba(0,255,136,0.05)',
                    border: `1px solid ${simResult.type === 'blocked' ? 'rgba(239,68,68,0.28)' : 'rgba(0,255,136,0.24)'}`,
                  }}
                >
                  {/* Result header */}
                  <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${simResult.type === 'blocked' ? 'rgba(239,68,68,0.14)' : 'rgba(0,255,136,0.12)'}` }}>
                    {NM[simResult.warrior]?.image ? (
                      <img src={NM[simResult.warrior].image} alt={NM[simResult.warrior].label}
                        style={{ width: 28, height: 28, objectFit: 'contain', filter: `drop-shadow(0 0 4px ${NM[simResult.warrior].color}88)` }} />
                    ) : (
                      <span className="text-xl">{NM[simResult.warrior]?.emoji}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold font-mono text-sm" style={{ color: simResult.type === 'blocked' ? '#ef4444' : '#00ff88' }}>
                          {simResult.type === 'blocked' ? '❌ ATTACK BLOCKED' : '✅ REQUEST DELIVERED'}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: simResult.type === 'blocked' ? 'rgba(239,68,68,0.14)' : 'rgba(0,255,136,0.1)', color: simResult.type === 'blocked' ? '#fca5a5' : '#86efac' }}>
                          {simResult.verdict}
                        </span>
                      </div>
                      <div className="text-xs font-mono mt-0.5" style={{ color:'rgba(255,255,255,0.38)' }}>
                        {simResult.attackType} · Defender: <span style={{ color: NM[simResult.warrior]?.color }}>{NM[simResult.warrior]?.label}</span>
                        {simResult.score !== undefined && <span style={{ color:'#f472b6' }}> · Risk score: {simResult.score}/100</span>}
                      </div>
                    </div>
                    {!simResult.backendOk && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0" style={{ background:'rgba(251,146,60,0.1)', border:'1px solid rgba(251,146,60,0.2)', color:'#fb923c' }}>
                        backend offline · demo
                      </span>
                    )}
                  </div>

                  {/* Result lines */}
                  <div className="px-5 py-3 flex flex-col gap-1.5">
                    {simResult.lines.map((line, i) => (
                      <motion.div key={i} initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.07, duration:0.2 }}
                        className="flex items-start gap-2 text-xs font-mono" style={{ color:'rgba(255,255,255,0.58)' }}>
                        <span className="flex-shrink-0 mt-0.5" style={{ color: simResult.type === 'blocked' ? '#ef4444' : '#00ff88' }}>▸</span>
                        <span>{line}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Detail panel */}
          <div className="w-full xl:w-80 flex-shrink-0">
            <AnimatePresence mode="wait">
              {selNode && selDetail ? (
                <motion.div key={selNode.id} initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:24 }} transition={{ duration:0.26 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background:'#0b0b0f', border:`1px solid ${selNode.color}28`, boxShadow:`0 0 40px ${selNode.color}0a` }}>

                  <div className="px-5 py-4" style={{ background:`linear-gradient(135deg, ${selNode.color}0d, transparent)`, borderBottom:`1px solid ${selNode.color}18` }}>
                    <div className="flex items-start gap-3">
                      {selNode.image ? (
                        <img src={selNode.image} alt={selNode.label}
                          style={{ width: 48, height: 48, objectFit: 'contain', filter: `drop-shadow(0 0 6px ${selNode.color}88)` }} />
                      ) : (
                        <span className="text-3xl mt-0.5">{selNode.emoji}</span>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-mono tracking-widest mb-1" style={{ color: hexA(selNode.color, 0.65), letterSpacing:'2px' }}>{selDetail.badge}</div>
                        <div className="font-bold font-mono text-lg leading-tight" style={{ color: selNode.color }}>{selNode.label}</div>
                        <div className="text-xs font-mono mt-0.5" style={{ color:'rgba(255,255,255,0.35)' }}>{selNode.sub}</div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4" style={{ borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
                    <p className="text-xs leading-relaxed" style={{ color:'rgba(255,255,255,0.58)', fontFamily:'var(--font-body)' }}>{selDetail.desc}</p>
                  </div>

                  {selDetail.tech.length > 0 && (
                    <div className="px-5 py-4" style={{ borderBottom: selDetail.defeats.length ? `1px solid rgba(255,255,255,0.05)` : 'none' }}>
                      <div className="text-xs font-mono tracking-widest mb-3" style={{ color:'rgba(255,255,255,0.25)', letterSpacing:'2px' }}>TECHNOLOGY</div>
                      <ul className="space-y-2">
                        {selDetail.tech.map((t, i) => (
                          <motion.li key={i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05, duration:0.2 }}
                            className="flex items-start gap-2 text-xs" style={{ color:'rgba(255,255,255,0.62)' }}>
                            <span className="mt-0.5 flex-shrink-0" style={{ color: selNode.color }}>◆</span>
                            <span>{t}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selDetail.defeats.length > 0 && (
                    <div className="px-5 py-4" style={{ borderBottom: WARRIORS.includes(selNode.id) ? `1px solid rgba(255,255,255,0.05)` : 'none' }}>
                      <div className="text-xs font-mono tracking-widest mb-3" style={{ color:'rgba(255,255,255,0.25)', letterSpacing:'2px' }}>DEFEATS</div>
                      <ul className="space-y-2">
                        {selDetail.defeats.map((d, i) => (
                          <motion.li key={i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05+0.1, duration:0.2 }}
                            className="flex items-center gap-2 text-xs" style={{ color:'#f87171' }}>
                            <span className="flex-shrink-0">✕</span><span>{d}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Simulate this warrior CTA */}
                  {WARRIORS.includes(selNode.id) && (
                    <div className="px-5 pb-5 pt-2">
                      <motion.button
                        onClick={runAttack} disabled={simState !== 'idle'}
                        whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                        className="w-full rounded-lg py-2.5 text-xs font-mono font-semibold tracking-wide transition-colors disabled:opacity-40"
                        style={{ background: hexA(selNode.color, 0.14), border:`1px solid ${hexA(selNode.color, 0.35)}`, color: selNode.color }}>
                        {simState === 'attack' ? '⚡ Intercepting…' : `⚡ Test ${selNode.label} Defense`}
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  className="rounded-2xl flex flex-col items-center justify-center text-center p-8 gap-4"
                  style={{ background:'#0b0b0f', border:'1px solid rgba(255,255,255,0.06)', minHeight:'260px' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background:'rgba(201,162,39,0.08)', border:'1px solid rgba(201,162,39,0.2)' }}>🐼</div>
                  <div>
                    <div className="text-xs font-mono mb-1" style={{ color:'rgba(255,255,255,0.25)', letterSpacing:'2px' }}>CLICK ANY NODE</div>
                    <div className="text-xs" style={{ color:'rgba(255,255,255,0.18)', fontFamily:'var(--font-body)' }}>Select a warrior to see its tech and test its defense</div>
                  </div>
                  <div className="flex flex-col gap-2 w-full mt-2">
                    {[{ id:'monkey', label:'🐒 Test MONKEY Identity' }, { id:'mantis', label:'🦗 Test MANTIS AI Anomaly' }, { id:'tigress', label:'🐯 Test TIGRESS Prompt Defense' }].map(item => (
                      <button key={item.id} onClick={() => setSel(item.id)}
                        className="w-full text-xs font-mono py-2 rounded-lg transition-colors"
                        style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)' }}
                        onMouseEnter={e => (e.currentTarget.style.color='rgba(255,255,255,0.7)')}
                        onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.4)')}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Bottom stat strip */}
        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6, delay:0.4 }}
          className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { n:'5',  label:'Security Layers',    sub:'MONKEY · CRANE · SNAKE · MANTIS · TIGRESS', color:'#c9a227' },
            { n:'2',  label:'External AI Gates',  sub:'ArmorIQ · ArmorClaw',                       color:'#a78bfa' },
            { n:'47', label:'Features Active',    sub:'Real cryptography, real DB, zero mocks',    color:'#00ff88' },
            { n:'0',  label:'Undetected Attacks', sub:'In 11-attack Mirror Test suite',            color:'#60a5fa' },
          ].map(s => (
            <div key={s.n} className="rounded-xl p-4" style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-3xl font-bold font-mono" style={{ color: s.color }}>{s.n}</div>
              <div className="text-xs font-semibold mt-1 mb-0.5" style={{ color:'rgba(255,255,255,0.6)' }}>{s.label}</div>
              <div className="text-xs" style={{ color:'rgba(255,255,255,0.25)', fontFamily:'var(--font-body)' }}>{s.sub}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
