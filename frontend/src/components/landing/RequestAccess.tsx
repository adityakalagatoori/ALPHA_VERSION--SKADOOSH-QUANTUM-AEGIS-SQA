import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SparklesText } from '@/components/ui/sparkles-text'
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { submitAccessRequest } from '@/api/accessApi'

const purposeCategories = ['Banking', 'Healthcare', 'Legal', 'Government', 'Enterprise', 'Research', 'Student']

export default function RequestAccess() {
  const [form, setForm] = useState({
    full_name: '', email: '', organization: '', sector: '', purpose: '', expected_usage: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.sector || !form.purpose) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await submitAccessRequest({
        full_name: form.full_name,
        email: form.email,
        organization: form.organization || 'N/A',
        sector: form.sector,
        purpose: form.purpose,
        expected_usage: form.expected_usage || form.purpose,
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="request-access" className="py-24 relative">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--kfp-border), transparent)' }} />

      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <SparklesText
            text="Request Access to the Gateway"
            colors={{ first: '#c9a227', second: '#f0c040' }}
            className="text-2xl md:text-4xl leading-tight"
            sparklesCount={10}
          />
        </div>

        {/* Scroll container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative p-8 rounded-lg"
          style={{
            background: 'radial-gradient(ellipse, #2a1f0a 0%, #0f0b05 100%)',
            border: '1px solid var(--kfp-border)',
            boxShadow: '0 0 60px rgba(201,162,39,0.1), 0 24px 64px rgba(0,0,0,0.8)',
          }}
        >
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-6">📜</div>
                <h3 className="text-2xl mb-3" style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-display)' }}>
                  Scroll Received
                </h3>
                <p className="text-base leading-relaxed" style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-body)' }}>
                  Your scroll has been received.<br />
                  The Dragon Warrior will respond within 24 hours.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                      Full Name *
                    </Label>
                    <Input
                      className="kfp-input"
                      placeholder="Your full name"
                      value={form.full_name}
                      onChange={e => handleChange('full_name', e.target.value)}
                      style={{ background: 'rgba(26,18,8,0.8)', borderColor: 'rgba(201,162,39,0.3)', color: 'var(--kfp-parchment)' }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                      Email Address *
                    </Label>
                    <Input
                      type="email"
                      className="kfp-input"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={e => handleChange('email', e.target.value)}
                      style={{ background: 'rgba(26,18,8,0.8)', borderColor: 'rgba(201,162,39,0.3)', color: 'var(--kfp-parchment)' }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                    Organization
                  </Label>
                  <Input
                    className="kfp-input"
                    placeholder="Your organization (optional)"
                    value={form.organization}
                    onChange={e => handleChange('organization', e.target.value)}
                    style={{ background: 'rgba(26,18,8,0.8)', borderColor: 'rgba(201,162,39,0.3)', color: 'var(--kfp-parchment)' }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                    Purpose Category *
                  </Label>
                  <select
                    className="kfp-input w-full rounded"
                    value={form.sector}
                    onChange={e => handleChange('sector', e.target.value)}
                    style={{ background: 'rgba(26,18,8,0.8)', borderColor: 'rgba(201,162,39,0.3)', color: form.sector ? 'var(--kfp-parchment)' : 'var(--kfp-text-sec)', padding: '0.625rem 0.875rem', border: '1px solid rgba(201,162,39,0.3)', borderRadius: '4px' }}
                  >
                    <option value="" style={{ background: '#1a1208' }}>Select your sector...</option>
                    {purposeCategories.map(c => (
                      <option key={c} value={c} style={{ background: '#1a1208' }}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                    Describe Your Use Case *
                  </Label>
                  <textarea
                    className="kfp-input w-full resize-none"
                    rows={4}
                    placeholder="Tell us what you're building..."
                    value={form.purpose}
                    onChange={e => handleChange('purpose', e.target.value)}
                    style={{ background: 'rgba(26,18,8,0.8)', borderColor: 'rgba(201,162,39,0.3)', color: 'var(--kfp-parchment)', padding: '0.625rem 0.875rem', border: '1px solid rgba(201,162,39,0.3)', borderRadius: '4px', fontFamily: 'var(--font-body)', width: '100%', outline: 'none' }}
                  />
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm py-2 px-4 rounded"
                      style={{ color: '#ef4444', background: 'rgba(139,26,26,0.2)', border: '1px solid rgba(139,26,26,0.4)', fontFamily: 'var(--font-body)' }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <RippleButton
                    variant="default"
                    className="w-full py-3 text-base font-semibold"
                    disabled={submitting}
                    style={{ background: 'var(--kfp-jade)', color: '#000', border: '1px solid rgba(0,255,136,0.4)', borderRadius: '4px' } as React.CSSProperties}
                  >
                    {submitting ? 'Sending your scroll...' : 'Submit Request'}
                  </RippleButton>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
