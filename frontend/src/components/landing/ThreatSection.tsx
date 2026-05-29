import { motion } from 'framer-motion'
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation'

const threats = [
  'Every AI agent runs on an API key — no face, no proof, no limit',
  'One stolen key = full agent impersonation. Zero detection.',
  'Audit logs are editable — attackers erase every track',
  "Shor's Algorithm shatters RSA & ECDSA overnight",
  'Harvest Now, Decrypt Later — traffic recorded today, decrypted tomorrow',
]

const responses = [
  'CRYSTALS-Dilithium identity per agent — unforgeable',
  'Stolen key = dead key. Blacklisted in one call.',
  'SHA-3-256 immutable chain — tamper detected in 60 seconds',
  'Kyber-1024 encryption — quantum-safe from day one',
  'Post-quantum architecture built before the threat arrives',
]

const rowVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const rowItem = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4 } },
}
const respItem = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4 } },
}

export default function ThreatSection() {
  return (
    <section id="threats" className="relative overflow-hidden py-0">
      <BackgroundGradientAnimation
        gradientBackgroundStart="rgb(30, 0, 0)"
        gradientBackgroundEnd="rgb(10, 8, 6)"
        firstColor="61, 0, 0"
        secondColor="26, 0, 0"
        thirdColor="10, 8, 6"
        fourthColor="45, 0, 0"
        fifthColor="20, 8, 0"
        pointerColor="80, 10, 0"
        containerClassName="min-h-screen"
        className="relative z-10"
      >
        <div className="w-full max-w-7xl mx-auto px-6 py-28">
          {/* Central quote */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <p className="text-2xl md:text-3xl italic leading-relaxed max-w-2xl mx-auto"
              style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-display)' }}>
              "Tai Lung isn't coming.<br />He's already inside the valley."
            </p>
          </motion.div>

          {/* Two-column threats vs responses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Threats */}
            <motion.div
              variants={rowVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="text-xs tracking-[0.2em] uppercase mb-6" style={{ color: '#ef4444', fontFamily: 'var(--font-heading)' }}>
                ⚠ THE THREAT LANDSCAPE
              </h3>
              {threats.map((t, i) => (
                <motion.div key={i} variants={rowItem} className="flex items-start gap-3 p-4 rounded"
                  style={{ background: 'rgba(139,26,26,0.15)', border: '1px solid rgba(139,26,26,0.3)' }}>
                  <span className="text-red-500 text-lg flex-shrink-0 mt-0.5">✗</span>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)', fontSize: '0.95rem' }}>{t}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Responses */}
            <motion.div
              variants={rowVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="text-xs tracking-[0.2em] uppercase mb-6" style={{ color: 'var(--kfp-jade-bright)', fontFamily: 'var(--font-heading)' }}>
                ✓ SQA RESPONSE
              </h3>
              {responses.map((r, i) => (
                <motion.div key={i} variants={respItem} className="flex items-start gap-3 p-4 rounded"
                  style={{ background: 'rgba(74,124,89,0.12)', border: '1px solid rgba(0,255,136,0.2)' }}>
                  <span className="text-lg flex-shrink-0 mt-0.5" style={{ color: 'var(--kfp-jade-bright)' }}>✓</span>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-body)', fontSize: '0.95rem' }}>{r}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </BackgroundGradientAnimation>
    </section>
  )
}
