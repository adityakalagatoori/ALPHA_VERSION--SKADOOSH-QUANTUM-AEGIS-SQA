import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const TIMELINE = [
  {
    year: '2024',
    label: 'NOW',
    color: '#ff3333',
    title: 'Nation-State Actors Harvesting Encrypted Traffic',
    desc: 'Your AI agents are sending encrypted inter-service messages today. Adversaries are capturing and storing that traffic — even though they cannot read it yet.',
    source: 'CISA / NSA Advisory AA24-038A',
  },
  {
    year: '2027–2030',
    label: 'NEAR FUTURE',
    color: '#ff6600',
    title: 'Cryptographically Relevant Quantum Computer (CRQC)',
    desc: 'NIST projects a CRQC capable of breaking RSA-2048 and ECC-256 will exist within this window. All traffic harvested today becomes readable overnight.',
    source: 'NIST IR 8413 · Mosca\'s Theorem',
  },
  {
    year: '2030+',
    label: 'BREACH',
    color: '#ffaa00',
    title: 'Harvest Now, Decrypt Later Becomes Harvest Now, Read Now',
    desc: 'Every classical key ever used — JWT secrets, TLS certificates, API keys — is exposed. AI agent actions, financial transactions, patient data: all retroactively readable.',
    source: 'IBM Quantum / Google Quantum AI roadmaps',
  },
  {
    year: 'TODAY',
    label: 'SQA',
    color: '#00ff88',
    title: 'Kyber-1024 + Dilithium-3: Quantum-Safe from Day One',
    desc: 'SQA wraps every AI agent message in CRYSTALS-Kyber-1024 (NIST PQC standard). Even if adversaries capture your traffic today, it is unreadable — forever.',
    source: 'NIST FIPS 203 (ML-KEM) · FIPS 204 (ML-DSA)',
  },
]

const STATS = [
  { value: '3,072', label: 'Kyber-1024 security bits vs RSA-2048\'s 112', accent: '#00ff88' },
  { value: '~6 yr', label: 'Average time to CRQC (Mosca estimate, 2024)', accent: '#ff6600' },
  { value: '100%', label: 'SQA agents enrolled with post-quantum keys', accent: '#4488ff' },
]

export default function QuantumUrgency() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" id="quantum-urgency">
      {/* Dramatic dark gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255,51,51,0.06) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span
            className="inline-block text-xs tracking-[0.3em] font-semibold uppercase mb-4 px-3 py-1 rounded"
            style={{ color: '#ff3333', background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.3)', fontFamily: 'var(--font-heading)' }}
          >
            Threat Intelligence
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold leading-tight mb-4"
            style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-display)' }}>
            Harvest Now,{' '}
            <span style={{ color: '#ff3333' }}>Decrypt Later</span>
          </h2>
          <p className="text-base max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
            Nation-state actors documented by CISA and NSA are capturing your AI agent
            traffic today — storing it for when quantum computers can break classical encryption.
            The window to protect yourself is now. Not when the CRQC arrives.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-px"
            style={{ background: 'linear-gradient(to bottom, #ff3333, #ff6600, #ffaa00, #00ff88)', transform: 'translateX(-50%)' }}
          />

          <div className="space-y-10">
            {TIMELINE.map((item, i) => {
              const isRight = i % 2 === 0
              return (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: isRight ? 40 : -40 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className={`relative flex items-start gap-6 sm:gap-0 ${isRight ? 'sm:flex-row' : 'sm:flex-row-reverse'} pl-14 sm:pl-0`}
                >
                  {/* Node dot */}
                  <div
                    className="absolute left-4 sm:left-1/2 w-5 h-5 rounded-full border-2 border-current flex-shrink-0 -translate-x-1/2 mt-1 z-10"
                    style={{ borderColor: item.color, background: item.color + '33', boxShadow: `0 0 12px ${item.color}66` }}
                  />

                  {/* Content card */}
                  <div className={`sm:w-5/12 ${isRight ? 'sm:pr-10' : 'sm:pl-10 sm:ml-auto'}`}>
                    <div
                      className="rounded-xl border p-5"
                      style={{ borderColor: item.color + '40', background: item.color + '08' }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                          style={{ background: item.color + '22', color: item.color }}
                        >
                          {item.label}
                        </span>
                        <span className="text-xs text-gray-600 font-mono">{item.year}</span>
                      </div>
                      <h3 className="text-white font-semibold text-sm mb-2">{item.title}</h3>
                      <p className="text-gray-400 text-xs leading-relaxed mb-2">{item.desc}</p>
                      <p className="text-xs font-mono" style={{ color: item.color + 'bb' }}>↗ {item.source}</p>
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="hidden sm:block sm:w-5/12" />
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-white/8 bg-white/[0.02] p-5 text-center"
            >
              <div className="text-3xl font-bold font-mono mb-1" style={{ color: s.accent }}>
                {s.value}
              </div>
              <div className="text-gray-500 text-xs">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* CTA callout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="mt-10 text-center"
        >
          <div
            className="inline-block rounded-2xl border px-8 py-5"
            style={{ borderColor: 'rgba(0,255,136,0.3)', background: 'rgba(0,255,136,0.04)' }}
          >
            <p className="text-white font-semibold text-base mb-1">
              Retroactive security does not exist.
            </p>
            <p className="text-gray-400 text-sm">
              Traffic captured today stays captured. SQA's Kyber-1024 encryption makes
              your AI agent communications quantum-safe — right now, not in 2030.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
