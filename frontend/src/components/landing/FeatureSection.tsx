import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { SparklesText } from '@/components/ui/sparkles-text'

// Warrior data for orbital and cards
const warriors = [
  {
    emoji: '🐒', image: '/monkey.png', name: 'MONKEY',
    module: 'Post-Quantum Identity',
    features: ['CRYSTALS-Kyber + Dilithium', 'Enclave-Shielded Keys', 'Replay-Sealed Payloads'],
    defeats: 'Key Theft · Quantum Forgery · Replay Attacks',
    color: '#c9a227', orbitRadius: 170,
    phaseShift: 0,
  },
  {
    emoji: '🦢', image: '/crane.png', name: 'CRANE',
    module: 'Scoped Capability Tokens',
    features: ['Signed JWT per Agent', 'Mid-Execution Checkpoints', 'ArmorIQ Policy Gate'],
    defeats: 'Privilege Escalation · Scope Bypass · Token Theft',
    color: '#60a5fa', orbitRadius: 170,
    phaseShift: (2 * Math.PI) / 5,
  },
  {
    emoji: '🐍', image: '/snake.png', name: 'SNAKE',
    module: 'Quantum Audit Chain',
    features: ['SHA-3-256 Hash Chain', 'Dilithium-Signed Logs', 'Merkle Tamper Detection'],
    defeats: 'Log Tampering · Audit Erasure · Track Covering',
    color: '#00ff88', orbitRadius: 170,
    phaseShift: (4 * Math.PI) / 5,
  },
  {
    emoji: '🦗', image: '/mantis.png', name: 'MANTIS',
    module: 'Gemini AI Anomaly Detection',
    features: ['50-Action Behavioral Baseline', 'Real-Time Risk Scoring', 'Honeypot Routing'],
    defeats: 'Behavioral Takeover · Cold-Start Poisoning · Slow Infiltration',
    color: '#f472b6', orbitRadius: 170,
    phaseShift: (6 * Math.PI) / 5,
  },
  {
    emoji: '🐯', image: '/tigress.png', name: 'TIGRESS',
    module: 'ArmorClaw Prompt Defense',
    features: ['JSON/Base64/URL Injection Block', 'Session-Graph Semantic Hashing', 'Multi-Turn Drift Detection'],
    defeats: 'Prompt Injection · Encoded Payloads · Multi-Turn Manipulation',
    color: '#fb923c', orbitRadius: 170,
    phaseShift: (8 * Math.PI) / 5,
  },
]

function WarriorOrbital({ activeIndex, onSelect }: { activeIndex: number; onSelect: (i: number) => void }) {
  const [time, setTime] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    let id: number
    let last = performance.now()
    const tick = (now: number) => {
      setTime(t => t + (now - last) / 1000)
      last = now
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [paused])

  const size = 420

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Orbit ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: warriors[0].orbitRadius * 2,
          height: warriors[0].orbitRadius * 2,
          border: '1px solid rgba(201,162,39,0.2)',
          boxShadow: '0 0 40px rgba(201,162,39,0.08)',
        }}
      />

      {/* Center — Po logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full overflow-hidden flex items-center justify-center z-10"
        style={{ background: 'radial-gradient(circle, #2a1f0a, #0a0806)', border: '2px solid rgba(201,162,39,0.5)', boxShadow: '0 0 30px rgba(201,162,39,0.2)' }}>
        <img src="/po.png" alt="Po" className="w-full h-full object-contain" />
      </div>

      {/* Orbiting warriors */}
      {warriors.map((w, i) => {
        const angle = time * 0.4 + w.phaseShift
        const x = Math.cos(angle) * w.orbitRadius
        const y = Math.sin(angle) * w.orbitRadius
        const isActive = activeIndex === i
        return (
          <button
            key={i}
            className="absolute top-1/2 left-1/2 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 hover:scale-125 overflow-hidden"
            style={{
              width: 52, height: 52,
              transform: `translate(calc(${x}px - 26px), calc(${y}px - 26px))`,
              background: isActive ? `${w.color}22` : 'rgba(26,18,8,0.9)',
              border: `2px solid ${isActive ? w.color : 'rgba(201,162,39,0.3)'}`,
              boxShadow: isActive ? `0 0 20px ${w.color}60` : undefined,
              zIndex: isActive ? 20 : 10,
              padding: 4,
            }}
            onClick={() => onSelect(i)}
          >
            <img
              src={w.image}
              alt={w.name}
              style={{
                width: '100%', height: '100%',
                objectFit: 'contain',
                filter: isActive ? `drop-shadow(0 0 4px ${w.color})` : 'brightness(0.8)',
              }}
            />
          </button>
        )
      })}
    </div>
  )
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function FeatureSection() {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <section id="features" className="py-24 relative">
      {/* Jade radial glow top */}
      <div className="absolute inset-x-0 top-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(74,124,89,0.12) 0%, transparent 60%)', height: '300px' }}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Section title */}
        <div className="text-center mb-16">
          <SparklesText
            text="The Furious Five"
            colors={{ first: '#c9a227', second: '#00ff88' }}
            className="text-4xl md:text-5xl"
            sparklesCount={12}
          />
          <p className="mt-4 text-base" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)', maxWidth: '520px', margin: '16px auto 0' }}>
            Five warriors, five security layers. Each defeats a category of attack that would cripple unprotected AI systems.
          </p>
        </div>

        {/* Orbital + selected card */}
        <div className="flex flex-col lg:flex-row items-center gap-12 mb-16">
          <div className="flex-shrink-0">
            <WarriorOrbital activeIndex={activeIndex} onSelect={setActiveIndex} />
          </div>
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="kfp-card p-8 rounded flex-1 max-w-lg"
          >
            <div className="mb-4 flex items-center justify-start">
              <img
                src={warriors[activeIndex].image}
                alt={warriors[activeIndex].name}
                style={{
                  height: 80,
                  width: 'auto',
                  objectFit: 'contain',
                  filter: `drop-shadow(0 0 8px ${warriors[activeIndex].color}88)`,
                }}
              />
            </div>
            <h3 className="text-2xl mb-1" style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-heading)' }}>
              {warriors[activeIndex].name}
            </h3>
            <p className="text-base mb-4" style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-heading)' }}>
              {warriors[activeIndex].module}
            </p>
            <ul className="space-y-2 mb-5">
              {warriors[activeIndex].features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
                  <span style={{ color: 'var(--kfp-jade-bright)' }}>◆</span> {f}
                </li>
              ))}
            </ul>
            <p className="text-xs font-mono tracking-wide" style={{ color: 'var(--kfp-jade-bright)' }}>
              Defeats: {warriors[activeIndex].defeats}
            </p>
          </motion.div>
        </div>

        {/* All 5 cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {warriors.map((w, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="kfp-card p-5 cursor-pointer"
              style={{ borderColor: activeIndex === i ? w.color : undefined }}
              whileHover={{ y: -8, boxShadow: '0 16px 48px rgba(0,0,0,0.8), 0 0 20px rgba(201,162,39,0.2)' }}
              onClick={() => setActiveIndex(i)}
            >
              <div className="h-16 mb-3 flex items-center justify-start">
                <img
                  src={w.image}
                  alt={w.name}
                  style={{
                    height: '100%',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: activeIndex === i ? `drop-shadow(0 0 6px ${w.color}88)` : 'brightness(0.75)',
                    transition: 'filter 0.2s',
                  }}
                />
              </div>
              <h4 className="text-base font-semibold mb-1" style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-heading)' }}>{w.name}</h4>
              <p className="text-xs mb-3" style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-heading)' }}>{w.module}</p>
              <ul className="space-y-1">
                {w.features.slice(0,2).map((f, j) => (
                  <li key={j} className="text-xs" style={{ color: 'var(--kfp-text-sec)' }}>· {f}</li>
                ))}
              </ul>
              <p className="text-xs mt-3 font-mono" style={{ color: 'var(--kfp-jade-bright)', fontFamily: 'var(--font-mono)' }}>
                Defeats:<br/>{w.defeats.split(' · ')[0]}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
