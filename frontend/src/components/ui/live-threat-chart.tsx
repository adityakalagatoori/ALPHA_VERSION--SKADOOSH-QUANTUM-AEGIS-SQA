import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { callApi } from '@/api/client'

interface ChartData {
  days: string[]
  audit_counts: number[]
  honeypot_counts: number[]
  threat_breakdown: Record<string, number>
  total_audits: number
  total_honeypot: number
  total_blocked: number
}

const THREAT_META: Record<string, { color: string; label: string }> = {
  INJECTION: { color: '#fb923c', label: 'Injection' },
  IDENTITY:  { color: '#c9a227', label: 'Identity'  },
  PRIVILEGE: { color: '#a78bfa', label: 'Privilege' },
  BEHAVIOR:  { color: '#f472b6', label: 'Behavior'  },
  REPLAY:    { color: '#60a5fa', label: 'Replay'    },
}

// Simple SVG polyline chart
function SparkLines({ days, audits, honeypots }: { days: string[]; audits: number[]; honeypots: number[] }) {
  const W = 400, H = 140
  const PL = 8, PR = 8, PT = 10, PB = 28
  const cW = W - PL - PR
  const cH = H - PT - PB
  const n = days.length

  const maxVal = Math.max(...audits, ...honeypots, 1)

  const px = (i: number) => PL + (i / (n - 1)) * cW
  const py = (v: number) => PT + cH - (v / maxVal) * cH

  const toPath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ')

  const toArea = (vals: number[], color: string) => {
    const line = toPath(vals)
    const close = ` L${px(n - 1).toFixed(1)},${(PT + cH).toFixed(1)} L${px(0).toFixed(1)},${(PT + cH).toFixed(1)} Z`
    return (
      <path
        d={line + close}
        fill={color}
        fillOpacity={0.08}
        stroke="none"
      />
    )
  }

  // Grid lines
  const gridY = [0, 0.25, 0.5, 0.75, 1].map(f => PT + cH - f * cH)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      {/* Grid */}
      {gridY.map((y, i) => (
        <line key={i} x1={PL} y1={y} x2={W - PR} y2={y}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}

      {/* Area fills */}
      {toArea(audits, '#c9a227')}
      {toArea(honeypots, '#ef4444')}

      {/* Lines */}
      <motion.path
        d={toPath(audits)}
        fill="none" stroke="#c9a227" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <motion.path
        d={toPath(honeypots)}
        fill="none" stroke="#ef4444" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="4 3"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
      />

      {/* Dots on audit line */}
      {audits.map((v, i) => (
        <motion.circle
          key={i} cx={px(i)} cy={py(v)} r={2.5}
          fill="#c9a227" stroke="#0a0a0f" strokeWidth={1}
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 + i * 0.06 }}
        />
      ))}

      {/* X-axis labels */}
      {days.map((d, i) => (
        <text key={i} x={px(i)} y={H - 4} textAnchor="middle"
          fontSize="8" fill="rgba(255,255,255,0.28)" fontFamily="monospace">
          {d}
        </text>
      ))}
    </svg>
  )
}

export default function LiveThreatChart() {
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    callApi('GET', '/v2/po/threat-chart').then(({ data: d }) => {
      if (mountedRef.current && d) setData(d as ChartData)
    }).finally(() => {
      if (mountedRef.current) setLoading(false)
    })
    return () => { mountedRef.current = false }
  }, [])

  const fallbackDays = ['5/23','5/24','5/25','5/26','5/27','5/28','5/29']
  const days     = data?.days            ?? fallbackDays
  const audits   = data?.audit_counts    ?? [0,0,0,0,0,0,0]
  const honeypots = data?.honeypot_counts ?? [0,0,0,0,0,0,0]
  const threats  = data?.threat_breakdown ?? {}
  const totalThreats = Object.values(threats).reduce((a, b) => a + b, 0) || 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-2xl rounded-2xl overflow-hidden"
      style={{
        background: '#0a0a0f',
        border: '1px solid rgba(201,162,39,0.18)',
        boxShadow: '0 0 60px rgba(201,162,39,0.05), 0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <div className="text-xs font-mono tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '2px' }}>
            LIVE · SUPABASE
          </div>
          <h3 className="font-bold font-mono text-lg" style={{ color: 'var(--kfp-parchment)' }}>
            Threat Activity
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <span className="w-5 border-t-2" style={{ borderColor: '#c9a227' }} />
            Audit Events
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <span className="w-5 border-t-2 border-dashed" style={{ borderColor: '#ef4444' }} />
            Honeypot
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pt-4 pb-2">
        {loading ? (
          <div className="h-36 flex items-center justify-center">
            <div className="text-xs font-mono animate-pulse" style={{ color: 'rgba(201,162,39,0.5)' }}>
              Fetching live data…
            </div>
          </div>
        ) : (
          <SparkLines days={days} audits={audits} honeypots={honeypots} />
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' }}>
        {[
          { label: 'Audit Entries', value: data?.total_audits ?? '—', color: '#c9a227' },
          { label: 'Honeypot Caught', value: data?.total_honeypot ?? '—', color: '#ef4444' },
          { label: 'Threats Blocked', value: data?.total_blocked ?? '—', color: '#00ff88' },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3 text-center" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="text-xl font-bold font-mono" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', fontSize: '9px' }}>
              {s.label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Threat breakdown */}
      <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="text-xs font-mono tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '2px' }}>
          THREAT CATEGORIES · 7-DAY
        </div>
        <div className="flex flex-col gap-2">
          {Object.entries(THREAT_META).map(([key, meta]) => {
            const count = threats[key] ?? 0
            const pct = Math.round((count / totalThreats) * 100)
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="w-16 text-xs font-mono flex-shrink-0" style={{ color: meta.color, fontSize: '10px' }}>
                  {meta.label}
                </div>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: meta.color, width: `${pct}%` }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  />
                </div>
                <div className="text-xs font-mono w-10 text-right" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
                  {count > 0 ? `${count}` : '—'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
