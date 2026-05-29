import { motion } from 'framer-motion'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

const faqs = [
  {
    q: 'What is Skadoosh Quantum Aegis?',
    a: 'SQA is a post-quantum AI security platform that wraps every AI agent with five security layers: post-quantum identity (Monkey), scoped capability tokens (Crane), immutable audit chain (Snake), Gemini-powered anomaly detection (Mantis), and prompt injection defense (Tigress). It was built for industries where a single breach is catastrophic.',
  },
  {
    q: 'Why post-quantum? Quantum computers aren\'t here yet.',
    a: '"Harvest Now, Decrypt Later" attacks are real today. Adversaries record encrypted traffic now and will decrypt it once quantum hardware matures. Kyber-1024 and CRYSTALS-Dilithium are NIST-standardized algorithms — deploying them before the threat arrives is the only viable strategy.',
  },
  {
    q: 'How does access control work? Do agents share API keys?',
    a: 'No. Every agent receives a CRYSTALS-Dilithium keypair at registration — unforgeable, per-agent identity. Capability tokens (signed JWTs) expire in 5 minutes. A stolen key is blacklisted with a single admin call and becomes permanently dead. There are no shared keys, no service accounts, no ambient authority.',
  },
  {
    q: 'How is SQA different from traditional API security gateways?',
    a: 'Traditional gateways guard the perimeter. SQA guards the agent\'s behavior — what it does, what it says, and what it is. The Mantis module baselines 50 actions per agent and detects drift in real time. Tigress scans every prompt for injection patterns before execution. Snake signs every action with Dilithium-3, so no log can be erased.',
  },
  {
    q: 'Is my data shared with any third party?',
    a: 'Gemini AI analysis runs under a signed Business Associate Agreement (BAA) for HIPAA-eligible data. All cryptographic operations (key generation, signing, audit hashing) run inside the SQA enclave. No plaintext keys, no unencrypted audit data, and no cross-tenant data leakage — each user sees only their own agents and audit trail.',
  },
]

export default function FaqSection() {
  return (
    <section id="faq" className="py-24 relative">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--kfp-border), transparent)' }} />

      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-5xl mb-4" style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-display)' }}>
            The Dragon Scroll FAQ
          </h2>
          <p className="text-sm" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
            The scroll contains no secrets — only answers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded px-6"
                style={{
                  background: 'rgba(26,18,8,0.7)',
                  border: '1px solid rgba(201,162,39,0.25)',
                  borderBottom: '1px solid rgba(201,162,39,0.25)',
                }}
              >
                <AccordionTrigger
                  className="text-left hover:no-underline py-5"
                  style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-heading)', fontSize: '0.95rem', letterSpacing: '0.02em' }}
                >
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent
                  style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', lineHeight: '1.7' }}
                >
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
