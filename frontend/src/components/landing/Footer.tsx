import { motion } from 'framer-motion'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Threats', href: '#threats' },
  { label: 'Sectors', href: '#sectors' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Request Access', href: '#request-access' },
]

export default function Footer() {
  return (
    <footer style={{ background: '#050302', borderTop: '1px solid rgba(201,162,39,0.2)' }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
          {/* Logo + tagline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <img src="/sqa-logo.png" alt="SQA" className="w-12 h-12 rounded-full object-cover flex-shrink-0" style={{ boxShadow: '0 0 14px rgba(201,162,39,0.45)' }} />
              <div>
                <p className="text-base font-semibold" style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em' }}>
                  SQA
                </p>
                <p className="text-xs" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
                  Skadoosh Quantum Aegis
                </p>
              </div>
            </div>
            <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
              Post-quantum security for the AI era. Built for the valley that will not fall.
            </p>
          </motion.div>

          {/* Nav links */}
          <motion.nav
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap gap-x-8 gap-y-3"
          >
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs transition-colors duration-200 hover:text-amber-300"
                style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textDecoration: 'none' }}
              >
                {link.label}
              </a>
            ))}
          </motion.nav>
        </div>

        {/* Bamboo divider */}
        <div className="my-10 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.2), transparent)' }} />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: 'rgba(168,152,128,0.5)', fontFamily: 'var(--font-body)' }}>
            Â© 2026 Skadoosh Quantum Aegis. The Jade Palace holds.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'rgba(168,152,128,0.4)', fontFamily: 'var(--font-body)' }}>
              Crafted with <img src="/sqa-logo.png" alt="" style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', margin: '0 2px' }} /> by the Dragon Warrior team
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
