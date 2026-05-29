import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { SparklesText } from '@/components/ui/sparkles-text'
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '../hooks/useAuth'
import '@/styles/kfp-theme.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Fill in both fields, warrior.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        setError('The gate does not recognize you. Check your credentials.')
      } else {
        navigate('/dashboard')
      }
    } catch {
      setError('The Jade Palace is momentarily unreachable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuroraBackground
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #0a0806 0%, #1a1208 50%, #0a0806 100%)' }}
    >
      <div className="w-full flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <Link to="/" className="inline-flex flex-col items-center gap-3 group">
            <div className="w-24 h-24 rounded-full overflow-hidden group-hover:scale-110 transition-transform duration-300" style={{ boxShadow: '0 0 30px rgba(201,162,39,0.55), 0 0 60px rgba(201,162,39,0.2)' }}>
              <img src="/sqa-logo.png" alt="SQA" className="w-full h-full object-cover" />
            </div>
            <SparklesText
              text="SQA"
              colors={{ first: '#c9a227', second: '#f0c040' }}
              className="text-4xl"
              sparklesCount={6}
            />
            <p className="text-xs tracking-[0.2em]" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-heading)' }}>
              ENTER THE JADE PALACE
            </p>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-sm p-8 rounded-lg"
          style={{
            background: 'radial-gradient(ellipse, #2a1f0a 0%, #0f0b05 100%)',
            border: '1px solid var(--kfp-border)',
            boxShadow: '0 0 60px rgba(201,162,39,0.12), 0 24px 64px rgba(0,0,0,0.8)',
          }}
        >
          <h2 className="text-center text-xl mb-6" style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-display)' }}>
            Warrior Credentials
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                Email
              </Label>
              <Input
                type="email"
                className="kfp-input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ background: 'rgba(26,18,8,0.8)', borderColor: 'rgba(201,162,39,0.3)', color: 'var(--kfp-parchment)' }}
              />
            </div>

            <div className="space-y-1.5">
              <Label style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                Password
              </Label>
              <Input
                type="password"
                className="kfp-input"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ background: 'rgba(26,18,8,0.8)', borderColor: 'rgba(201,162,39,0.3)', color: 'var(--kfp-parchment)' }}
              />
            </div>

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
                className="w-full py-3 text-sm font-semibold"
                disabled={loading}
                style={{ background: 'var(--kfp-jade)', color: '#000', border: '1px solid rgba(0,255,136,0.4)', borderRadius: '4px' } as React.CSSProperties}
              >
                {loading ? 'Verifying identity...' : 'Enter the Gateway'}
              </RippleButton>
            </motion.div>
          </form>

          <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(201,162,39,0.15)' }}>
            <p className="text-center text-xs" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
              No scroll yet?{' '}
              <a href="/#request-access" className="transition-colors" style={{ color: 'var(--kfp-gold)' }}>
                Request access
              </a>
            </p>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-xs text-center"
          style={{ color: 'rgba(168,152,128,0.4)', fontFamily: 'var(--font-body)' }}
        >
          <Link to="/" style={{ color: 'rgba(201,162,39,0.4)' }}>â† Return to the valley</Link>
        </motion.p>
      </div>
    </AuroraBackground>
  )
}
