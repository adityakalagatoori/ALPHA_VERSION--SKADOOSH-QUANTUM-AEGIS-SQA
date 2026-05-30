import { motion } from 'framer-motion'
import { Shield, Swords, Zap, Atom } from 'lucide-react'
import LiveThreatChart from '@/components/ui/live-threat-chart'

const stats = [
  { value: '47', label: 'Security Features',         Icon: Shield },
  { value: '5',  label: 'Warrior Modules',           Icon: Swords },
  { value: '11', label: 'Attack Vectors Neutralized', Icon: Zap    },
  { value: '100%', label: 'Post-Quantum Ready',       Icon: Atom   },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function StatsSection() {
  return (
    <section id="stats" className="py-24 relative">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--kfp-border), transparent)' }} />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="kfp-card p-6 text-center rounded"
              whileHover={{ y: -6 }}
            >
              <div className="flex justify-center mb-3">
                <span
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 44, height: 44, background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)' }}
                >
                  <s.Icon size={22} style={{ color: 'var(--kfp-gold-light)' }} strokeWidth={1.5} />
                </span>
              </div>
              <div className="text-4xl font-bold mb-1" style={{ color: 'var(--kfp-gold-light)', fontFamily: 'var(--font-display)' }}>
                {s.value}
              </div>
              <div className="text-xs tracking-wide" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-heading)' }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex justify-center">
          <LiveThreatChart />
        </div>
      </div>
    </section>
  )
}
