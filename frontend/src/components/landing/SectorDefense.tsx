import { motion } from 'framer-motion'
import { Landmark, HeartPulse, Scale, Building2, TrendingUp, ShieldCheck } from 'lucide-react'
import { SparklesText } from '@/components/ui/sparkles-text'

const sectors = [
  {
    Icon: Landmark, name: 'Banking',
    threat: 'Harvest attacks on payment signatures',
    defense: 'Kyber-1024 channel encryption + Dilithium payment signing',
    color: '#c9a227',
  },
  {
    Icon: HeartPulse, name: 'Healthcare',
    threat: 'Editable audit records — Tai Lung changes the file',
    defense: 'Tamper-proof audit trails + HIPAA-compliant Gemini BAA',
    color: '#4a7c59',
  },
  {
    Icon: Scale, name: 'Legal',
    threat: 'No behavioral trail — no proof of tampering',
    defense: 'Behavioral monitoring + zero-trust execution',
    color: '#60a5fa',
  },
  {
    Icon: Building2, name: 'Government',
    threat: 'Classical crypto collapses when quantum arrives',
    defense: 'Post-quantum identity + real-time anomaly intelligence',
    color: '#f472b6',
  },
  {
    Icon: TrendingUp, name: 'Trading',
    threat: 'Sub-millisecond manipulation of algorithmic orders',
    defense: 'BFT consensus + Dilithium financial signing per transaction',
    color: '#34d399',
  },
  {
    Icon: ShieldCheck, name: 'Insurance',
    threat: 'AI claim fraud through behavioral drift injection',
    defense: 'MANTIS behavioral baseline + Oracle Scroll risk prediction',
    color: '#fb923c',
  },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function SectorDefense() {
  return (
    <section id="sectors" className="relative py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-4"
        >
          <SparklesText
            text="The Valley SQA Defends"
            colors={{ first: '#c9a227', second: '#f0c040' }}
            className="text-3xl md:text-5xl font-bold text-parchment font-display"
            sparklesCount={8}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center text-sm mb-16"
          style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)', maxWidth: 480, margin: '8px auto 64px' }}
        >
          Every sector faces unique quantum threats. SQA was built for the industries where a breach is catastrophic.
        </motion.p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sectors.map((s, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="kfp-card p-8 rounded"
              whileHover={{ scale: 1.02, boxShadow: '0 16px 48px rgba(0,0,0,0.8)' }}
            >
              <div className="flex items-start gap-4">
                <span
                  className="flex-shrink-0 flex items-center justify-center rounded-lg"
                  style={{ width: 44, height: 44, background: s.color + '18', border: `1px solid ${s.color}30` }}
                >
                  <s.Icon size={22} style={{ color: s.color }} strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: s.color, fontFamily: 'var(--font-heading)' }}>
                    {s.name}
                  </h3>
                  <div className="mb-3">
                    <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#ef4444', fontFamily: 'var(--font-heading)' }}>Threat</p>
                    <p className="text-sm" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>{s.threat}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--kfp-jade-bright)', fontFamily: 'var(--font-heading)' }}>SQA Defense</p>
                    <p className="text-sm" style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-body)' }}>{s.defense}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
