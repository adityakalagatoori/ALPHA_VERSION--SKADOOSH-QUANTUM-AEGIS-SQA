import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { submitAccessRequest } from '../api/accessApi'

const SECTORS = ['Banking', 'Healthcare', 'Legal', 'Government', 'Finance', 'Technology', 'Other']

export default function RequestAccess() {
  const [form, setForm] = useState({
    full_name: '', email: '', organization: '', sector: '', purpose: '', expected_usage: ''
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.sector) { setErrorMsg('Please select a sector'); return }
    setStatus('loading')
    try {
      await submitAccessRequest(form)
      setStatus('success')
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#020617] to-[#0d0b1a] text-white flex flex-col">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-cyan-500/10 bg-[#020617]/95 backdrop-blur-2xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-3 hover:opacity-80 transition">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield size={18} className="text-white" />
          </div>
          <div className="flex flex-col gap-0">
            <span className="text-lg font-black text-white tracking-widest">SQA</span>
            <span className="text-[8px] text-cyan-400/60 font-mono tracking-wider">Dragon Warrior</span>
          </div>
        </Link>
        <Link to="/" className="text-sm font-semibold text-gray-400 hover:text-white transition flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">
          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-green-500/40 bg-gradient-to-br from-green-500/10 via-[#0a1a1a] to-[#0a1a1a] p-12 text-center backdrop-blur-md"
            >
              <CheckCircle size={72} className="text-green-400 mx-auto mb-8 drop-shadow-lg drop-shadow-green-500/20" />
              <h2 className="text-4xl font-black text-white mb-5">Request Submitted!</h2>
              <p className="text-gray-300 mb-10 leading-relaxed text-lg">
                Your access request has been received. Our team will review it within 24 hours and send your credentials to <strong className="text-cyan-300">{form.email}</strong>.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-8 py-3.5 rounded-xl transition shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30"
              >
                Back to Home
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-white/[0.01] backdrop-blur-xl p-10 shadow-2xl"
            >
              <div className="text-center mb-10">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/10">
                  <Shield size={28} className="text-cyan-400" />
                </div>
                <h1 className="text-4xl font-black text-white mb-3">Request Early Access</h1>
                <p className="text-gray-400 text-base">Join the next generation of AI agent security. Tell us about your use case.</p>
              </div>

              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/15 px-5 py-4 backdrop-blur"
                >
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-200 font-medium">{errorMsg}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-gray-300 font-bold mb-2.5 tracking-widest uppercase">Full Name *</label>
                    <input
                      required
                      value={form.full_name}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="John Smith"
                      className="w-full bg-white/[0.03] border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 transition text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 font-bold mb-2.5 tracking-widest uppercase">Email *</label>
                    <input
                      required type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="security@company.com"
                      className="w-full bg-white/[0.03] border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 transition text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-gray-300 font-bold mb-2.5 tracking-widest uppercase">Organization *</label>
                    <input
                      required
                      value={form.organization}
                      onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                      placeholder="Acme Corporation"
                      className="w-full bg-white/[0.03] border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 transition text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 font-bold mb-2.5 tracking-widest uppercase">Industry Sector *</label>
                    <select
                      required
                      value={form.sector}
                      onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 transition text-sm font-medium"
                    >
                      <option value="">Select your industry...</option>
                      {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-2.5 tracking-widest uppercase">Primary Use Case *</label>
                  <input
                    required
                    value={form.purpose}
                    onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                    placeholder="e.g., Securing autonomous AI agents in financial operations"
                    className="w-full bg-white/[0.03] border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 transition text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 font-bold mb-2.5 tracking-widest uppercase">Expected Monthly Volume *</label>
                  <textarea
                    required rows={3}
                    value={form.expected_usage}
                    onChange={e => setForm(f => ({ ...f, expected_usage: e.target.value }))}
                    placeholder="Describe your expected request volume, types of agents, and security requirements..."
                    className="w-full bg-white/[0.03] border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 transition text-sm font-medium resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-cyan-500/50 disabled:to-blue-600/50 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 disabled:shadow-none mt-8"
                >
                  {status === 'loading' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : 'Submit Access Request'}
                </button>
              </form>

              <p className="text-center text-xs text-gray-500 mt-6">
                Already have access?{' '}
                <Link to="/login" className="text-cyan-400 hover:text-cyan-300">Sign in here</Link>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
