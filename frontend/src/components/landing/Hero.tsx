import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons'
import { SparklesCore } from '@/components/ui/sparkles'

const cyclingTitles = [
  'When Your AI Agent Breaches — Can You Prove What It Did?',
  'The Nation-State Already Has Your Encrypted Traffic',
  'Prevention Is Not Enough. Proof Is.',
  'The Gateway Tai Lung Cannot Break',
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function Hero() {
  const [titleIndex, setTitleIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setTitleIndex(i => (i + 1) % cyclingTitles.length)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <section id="why-sqa" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Ember spark overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <SparklesCore
          background="transparent"
          particleColor="#c9a227"
          particleDensity={50}
          speed={0.3}
          minSize={0.8}
          maxSize={1.6}
          className="w-full h-full"
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-28 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* LEFT — text content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6"
        >
          <motion.p
            variants={itemVariants}
            className="text-xs tracking-[0.25em] font-semibold uppercase"
            style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-heading)' }}
          >
            Post-Quantum AI Agent Security
          </motion.p>

          {/* Cycling title */}
          <motion.div variants={itemVariants} className="relative overflow-hidden" style={{ minHeight: '9rem' }}>
            <AnimatePresence mode="wait">
              <motion.h1
                key={titleIndex}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -60, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                className="text-4xl sm:text-5xl xl:text-6xl leading-tight"
                style={{
                  color: 'var(--kfp-parchment)',
                  fontFamily: 'var(--font-display)',
                  textShadow: '0 0 40px rgba(201,162,39,0.25)',
                }}
              >
                {cyclingTitles[titleIndex]}
              </motion.h1>
            </AnimatePresence>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-lg leading-relaxed max-w-xl"
            style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)', fontSize: '1.15rem' }}
          >
            Your AI agents act, decide, and execute — silently and at machine speed.
            When one is compromised, you need more than an alert.
            You need a <span style={{ color: 'var(--kfp-gold)' }}>court-admissible case file</span> with
            a quantum-signed audit chain, breach timeline, and Gemini executive summary —
            generated automatically the moment SQA catches the threat.
          </motion.p>

          <motion.div variants={itemVariants} className="flex gap-4 flex-wrap">
            <a href="#request-access">
              <RippleButton
                variant="default"
                className="px-7 py-3 font-semibold text-base"
                style={{ background: 'var(--kfp-jade)', color: '#000', borderRadius: '4px', border: '1px solid rgba(0,255,136,0.4)' } as React.CSSProperties}
              >
                Request Access
              </RippleButton>
            </a>
            <RippleButton
              variant="ghost"
              className="px-7 py-3 font-semibold text-base"
              style={{ color: 'var(--kfp-gold)', border: '1px solid rgba(201,162,39,0.4)', borderRadius: '4px' } as React.CSSProperties}
            >
              Watch Demo
            </RippleButton>
          </motion.div>

          {/* Stats row */}
          <motion.div variants={itemVariants} className="flex gap-6 pt-4 flex-wrap">
            {[
              { value: '47', label: 'Security Features' },
              { value: '5', label: 'Defense Layers' },
              { value: '4', label: 'Compliance Frameworks' },
              { value: '0s', label: 'Manual Audit Needed' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-3xl font-bold" style={{ color: 'var(--kfp-gold-light)', fontFamily: 'var(--font-display)' }}>
                  {stat.value}
                </span>
                <span className="text-xs tracking-wide mt-0.5" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-heading)' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT — SQA Logo Medallion with action effects */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex items-center justify-center relative"
          style={{ minHeight: '520px' }}
        >
          {/* ── Layer 1: Deep breathing ambient glow ── */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.85, 1.15, 0.85] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            className="absolute pointer-events-none rounded-full"
            style={{
              width: '480px', height: '480px',
              background: 'radial-gradient(ellipse at center, rgba(201,162,39,0.28) 0%, rgba(180,90,10,0.12) 45%, transparent 70%)',
              filter: 'blur(48px)',
            }}
          />

          {/* ── Layer 2: Local particle sparkles ── */}
          <div className="absolute pointer-events-none" style={{ width: '440px', height: '440px', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
            <SparklesCore
              background="transparent"
              particleColor="#c9a227"
              particleDensity={60}
              speed={0.6}
              minSize={0.6}
              maxSize={2.0}
              className="w-full h-full"
            />
          </div>

          {/* ── Layer 3: Burst pulse rings ── */}
          {[0, 1.6, 3.2].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ scale: [0.5, 2.2], opacity: [0.7, 0] }}
              transition={{ repeat: Infinity, duration: 4, delay, ease: 'easeOut' }}
              className="absolute pointer-events-none rounded-full"
              style={{ width: '220px', height: '220px', border: '1.5px solid rgba(201,162,39,0.55)' }}
            />
          ))}

          {/* ── Layer 4: Outer orbit ring ── */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
            className="absolute pointer-events-none rounded-full"
            style={{
              width: '400px', height: '400px',
              border: '1px solid rgba(201,162,39,0.18)',
              boxShadow: '0 0 30px rgba(201,162,39,0.08), inset 0 0 30px rgba(201,162,39,0.04)',
            }}
          >
            {/* 3 orbiting dots equally spaced */}
            {[0, 120, 240].map(deg => (
              <div key={deg} className="absolute rounded-full" style={{
                width: '10px', height: '10px',
                background: 'radial-gradient(circle, #fff 0%, #c9a227 50%, transparent 100%)',
                boxShadow: '0 0 14px #c9a227, 0 0 28px rgba(201,162,39,0.7)',
                top: `calc(50% + ${200 * Math.sin(deg * Math.PI / 180)}px - 5px)`,
                left: `calc(50% + ${200 * Math.cos(deg * Math.PI / 180)}px - 5px)`,
              }} />
            ))}
          </motion.div>

          {/* ── Layer 5: Middle ring — counter-clockwise dashed ── */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 14, ease: 'linear' }}
            className="absolute pointer-events-none rounded-full"
            style={{
              width: '320px', height: '320px',
              border: '1px dashed rgba(201,162,39,0.30)',
            }}
          >
            {[60, 240].map(deg => (
              <div key={deg} className="absolute rounded-full" style={{
                width: '7px', height: '7px',
                background: '#fb923c',
                boxShadow: '0 0 10px #fb923c, 0 0 20px rgba(251,146,60,0.6)',
                top: `calc(50% + ${160 * Math.sin(deg * Math.PI / 180)}px - 3.5px)`,
                left: `calc(50% + ${160 * Math.cos(deg * Math.PI / 180)}px - 3.5px)`,
              }} />
            ))}
          </motion.div>

          {/* ── Layer 6: Inner ring — fast clockwise ── */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="absolute pointer-events-none rounded-full"
            style={{
              width: '248px', height: '248px',
              border: '2px solid rgba(201,162,39,0.22)',
              boxShadow: '0 0 20px rgba(201,162,39,0.12)',
            }}
          >
            <div className="absolute rounded-full" style={{
              width: '6px', height: '6px',
              background: '#00ff88',
              boxShadow: '0 0 10px #00ff88, 0 0 20px rgba(0,255,136,0.6)',
              top: '-3px', left: 'calc(50% - 3px)',
            }} />
          </motion.div>

          {/* ── Layer 7: SQA Logo Medallion ── */}
          <motion.img
            src="/sqa-logo.png"
            alt="SQA — Skadoosh Quantum Aegis"
            initial={{ scale: 0, rotate: -30, opacity: 0 }}
            animate={{
              scale: 1,
              rotate: 0,
              opacity: 1,
              y: [0, -10, 0],
            }}
            transition={{
              scale:   { type: 'spring', stiffness: 160, damping: 14, delay: 0.6 },
              rotate:  { type: 'spring', stiffness: 160, damping: 14, delay: 0.6 },
              opacity: { duration: 0.5, delay: 0.6 },
              y:       { repeat: Infinity, duration: 5.5, ease: 'easeInOut', delay: 1.4 },
            }}
            style={{
              width: '220px',
              height: '220px',
              objectFit: 'contain',
              position: 'relative',
              zIndex: 10,
              filter: [
                'drop-shadow(0 0 40px rgba(201,162,39,0.9))',
                'drop-shadow(0 0 80px rgba(201,162,39,0.5))',
                'drop-shadow(0 0 120px rgba(255,140,0,0.3))',
                'brightness(1.08) saturate(1.2)',
              ].join(' '),
            }}
          />

          {/* ── Layer 8: Shield-flash on hover ── */}
          <motion.div
            animate={{ opacity: [0, 0.4, 0], scale: [0.9, 1.3, 0.9] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 2 }}
            className="absolute pointer-events-none rounded-full"
            style={{
              width: '240px', height: '240px', zIndex: 9,
              background: 'radial-gradient(ellipse at center, rgba(255,200,60,0.35) 0%, transparent 70%)',
            }}
          />

          {/* ── Bottom fade ── */}
          <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none" style={{
            background: 'linear-gradient(to top, var(--kfp-black) 0%, transparent 100%)',
            zIndex: 11,
          }} />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <span className="text-xs tracking-widest" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-heading)' }}>scroll</span>
        <span style={{ color: 'var(--kfp-gold)', fontSize: '1.2rem' }}>⌄</span>
      </motion.div>
    </section>
  )
}
