import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SmokeBackground } from '@/components/ui/spooky-smoke-animation'
import { SparklesText } from '@/components/ui/sparkles-text'
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import '@/styles/kfp-theme.css'

const ADMIN_KEY = 'sqa-admin-secret-2026'

export default function AdminLogin() {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!key.trim()) {
      setError('The sacred key is required.')
      return
    }
    setLoading(true)
    setError('')

    await new Promise(r => setTimeout(r, 600))

    if (key.trim() === ADMIN_KEY) {
      sessionStorage.setItem('sqa_admin_verified', 'true')
      navigate('/admin')
    } else {
      setError('Tai Lung would try harder. That key is wrong.')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center" style={{ background: '#0a0503' }}>
      {/* Smoke WebGL background */}
      <div className="absolute inset-0 z-0">
        <SmokeBackground smokeColor="#1a0a00" />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 z-[1]" style={{ background: 'rgba(10,5,3,0.55)' }} />

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-10 text-center"
        >
          <span className="text-5xl block mb-3">🐯</span>
          <SparklesText
            text="War Room Access"
            colors={{ first: '#c9a227', second: '#ef4444' }}
            className="text-3xl md:text-4xl"
            sparklesCount={8}
          />
          <p className="text-xs mt-2 tracking-[0.2em]" style={{ color: 'rgba(168,152,128,0.6)', fontFamily: 'var(--font-heading)' }}>
            JADE PALACE COMMAND — RESTRICTED
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-sm p-8 rounded-lg"
          style={{
            background: 'radial-gradient(ellipse, #200a0a 0%, #0a0302 100%)',
            border: '1px solid rgba(139,26,26,0.5)',
            boxShadow: '0 0 80px rgba(139,26,26,0.2), 0 24px 64px rgba(0,0,0,0.9)',
          }}
        >
          <p className="text-center text-sm mb-6 leading-relaxed" style={{ color: 'rgba(168,152,128,0.7)', fontFamily: 'var(--font-body)' }}>
            Only the Dragon Warrior may enter.<br />
            Present the sacred key.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label style={{ color: '#ef4444', fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                Admin Key
              </Label>
              <Input
                type="password"
                className="kfp-input"
                placeholder="••••••••••••••••••••"
                value={key}
                onChange={e => setKey(e.target.value)}
                style={{ background: 'rgba(20,8,8,0.9)', borderColor: 'rgba(139,26,26,0.4)', color: 'var(--kfp-parchment)' }}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm py-2 px-4 rounded"
                  style={{ color: '#ef4444', background: 'rgba(139,26,26,0.2)', border: '1px solid rgba(139,26,26,0.5)', fontFamily: 'var(--font-body)' }}
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
                style={{ background: 'var(--kfp-red)', color: 'var(--kfp-parchment)', border: '1px solid rgba(139,26,26,0.7)', borderRadius: '4px' } as React.CSSProperties}
              >
                {loading ? 'Authenticating...' : 'Enter War Room'}
              </RippleButton>
            </motion.div>
          </form>

          <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(139,26,26,0.2)' }}>
            <p className="text-center text-xs" style={{ color: 'rgba(168,152,128,0.4)', fontFamily: 'var(--font-body)' }}>
              <Link to="/login" style={{ color: 'rgba(201,162,39,0.5)' }}>← Warrior login</Link>
            </p>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-xs"
          style={{ color: 'rgba(139,26,26,0.4)', fontFamily: 'var(--font-body)' }}
        >
          Unauthorized access attempts are logged and reported.
        </motion.p>
      </div>
    </div>
  )
}
