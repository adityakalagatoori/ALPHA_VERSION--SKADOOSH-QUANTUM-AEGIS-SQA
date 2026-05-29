import { motion } from 'framer-motion'
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline'
import { ScrollText, Key, ShieldCheck } from 'lucide-react'

const timelineData = [
  {
    id: 1,
    title: 'Request Access',
    date: 'Step 1',
    content: 'Submit your name, email, sector, and purpose. The Dragon Warrior reviews every scroll personally.',
    category: 'Onboarding',
    icon: ScrollText,
    relatedIds: [2],
    status: 'completed' as const,
    energy: 85,
  },
  {
    id: 2,
    title: 'Receive Credentials',
    date: 'Step 2',
    content: 'Admin approves and assigns your password. You receive it by email — no shared keys, no API tokens.',
    category: 'Access',
    icon: Key,
    relatedIds: [1, 3],
    status: 'in-progress' as const,
    energy: 70,
  },
  {
    id: 3,
    title: 'Enter the Gateway',
    date: 'Step 3',
    content: 'Log in and access SQA. Your data, your agents, your view only — nobody else\'s.',
    category: 'Gateway',
    icon: ShieldCheck,
    relatedIds: [2],
    status: 'pending' as const,
    energy: 90,
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--kfp-border), transparent)' }} />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl mb-4" style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-display)' }}>
            How It Works
          </h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
            Three steps to stand inside the Jade Palace. No dark hallways, no unguarded gates.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <RadialOrbitalTimeline timelineData={timelineData} />
        </motion.div>
      </div>
    </section>
  )
}
