import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Demo mode: allow any login
    if (email && password) {
      try {
        // Store demo session in localStorage
        localStorage.setItem('demo_user', JSON.stringify({ email, id: 'demo-' + Date.now() }))
        navigate('/dashboard')
        return
      } catch (err) {
        setError('Demo login failed')
      }
    }

    // Try Supabase auth if demo fails
    const { error: signInError } = await signIn(email, password)
    if (signInError) {
      setError('Use any email/password for demo access')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#020617] to-[#0d0b1a] text-white flex flex-col items-center justify-center px-6">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Logo / Branding */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-xl group-hover:shadow-cyan-500/30 transition-all">
              <Shield size={24} className="text-white font-bold" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-black tracking-widest">SQA</div>
              <div className="text-xs text-cyan-400/60 font-mono">Dragon Warrior</div>
            </div>
          </Link>
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Mission Control</h1>
          <p className="text-sm text-gray-400">Enterprise security dashboard access</p>
        </div>

        {/* Demo access hint */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-xl border border-cyan-500/30 bg-cyan-500/10 backdrop-blur px-5 py-3.5 text-xs text-cyan-200"
        >
          <strong className="text-cyan-300">Demo Access:</strong> Use any email/password combination. New users can{' '}
          <Link to="/request-access" className="text-cyan-400 font-semibold hover:text-cyan-300 underline">request full access</Link>.
        </motion.div>

        <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-white/[0.01] backdrop-blur-xl p-8 shadow-2xl">
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs text-gray-300 font-bold mb-2.5 tracking-widest uppercase">Email Address</label>
              <input
                required type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="security@example.com"
                className="w-full bg-white/[0.03] border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 transition text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 font-bold mb-2.5 tracking-widest uppercase">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.03] border border-white/15 rounded-xl px-4 py-3.5 pr-11 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 transition text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-cyan-500/50 disabled:to-blue-600/50 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Access Mission Control
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-white/10">
            <p className="text-center text-xs text-gray-400">
              Don't have an account?{' '}
              <Link to="/request-access" className="text-cyan-400 font-semibold hover:text-cyan-300 transition">
                Request access
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 text-xs text-gray-500"
        >
          <p>Need help? Try the <Link to="/demo" className="text-cyan-400 hover:text-cyan-300 font-semibold">demo mode</Link> with any credentials.</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
