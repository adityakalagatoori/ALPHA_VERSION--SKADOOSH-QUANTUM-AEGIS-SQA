import { useState, useEffect, useCallback } from 'react'
import { ScrollText as ScrollIcon, CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SmokeBackground } from '@/components/ui/spooky-smoke-animation'
import { SparklesText } from '@/components/ui/sparkles-text'
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons'
import { getAccessRequests, approveRequest, rejectRequest, resendApprovalEmail, deleteAccessRequest, getApprovedUsers, deleteApprovedUser } from '../api/accessApi'
import '@/styles/kfp-theme.css'

const ADMIN_KEY = 'sqa-admin-secret-2026'

interface AccessRequest {
  id: string
  full_name: string
  email: string
  organization: string
  sector: string
  purpose: string
  status: string
  created_at: string
}

interface ApprovedUser {
  id: string
  email: string
  full_name: string
  organization: string
  role: string
  created_at: string
}

const sectorColors: Record<string, string> = {
  Banking: '#c9a227',
  Healthcare: '#4a7c59',
  Legal: '#60a5fa',
  Government: '#f472b6',
  Enterprise: '#fb923c',
  Research: '#a78bfa',
  Student: '#34d399',
}

function statusBadge(status: string) {
  if (status === 'approved') return { bg: 'rgba(74,124,89,0.2)', border: 'rgba(0,255,136,0.3)', color: '#00ff88', label: 'Approved' }
  if (status === 'rejected') return { bg: 'rgba(139,26,26,0.2)', border: 'rgba(139,26,26,0.4)', color: '#ef4444', label: 'Rejected' }
  return { bg: 'rgba(201,162,39,0.15)', border: 'rgba(201,162,39,0.35)', color: '#c9a227', label: 'Pending' }
}

export default function AdminPortal() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: 'approve' | 'reject'; name: string } | null>(null)
  const [approvedCreds, setApprovedCreds] = useState<{ email: string; password: string; name: string } | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'users'>('pending')
  const [resendId, setResendId] = useState<string | null>(null)
  const [resendResult, setResendResult] = useState<{ id: string; ok: boolean } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  // Users tab
  const [users, setUsers] = useState<ApprovedUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userDeleteConfirm, setUserDeleteConfirm] = useState<{ email: string; name: string } | null>(null)
  const [userDeleteId, setUserDeleteId] = useState<string | null>(null)
  const navigate = useNavigate()

  const loadRequests = useCallback(async () => {
    try {
      const data = await getAccessRequests(ADMIN_KEY)
      setRequests(Array.isArray(data) ? data : data.requests ?? [])
    } catch {
      // backend may be offline in demo
    } finally {
      setLoading(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const data = await getApprovedUsers(ADMIN_KEY)
      setUsers(Array.isArray(data) ? data : data.users ?? [])
    } catch { /* ignore */ }
    finally { setUsersLoading(false) }
  }, [])

  useEffect(() => { loadRequests() }, [loadRequests])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionId(id)
    try {
      if (action === 'approve') {
        const result = await approveRequest(id, ADMIN_KEY)
        if (result?.temp_password) {
          setApprovedCreds({ email: result.email, password: result.temp_password, name: result.full_name })
        }
      } else {
        await rejectRequest(id, ADMIN_KEY)
      }
      await loadRequests()
    } catch { /* ignore */ }
    setActionId(null)
    setConfirmModal(null)
  }

  const handleResendEmail = async (id: string) => {
    setResendId(id)
    try {
      await resendApprovalEmail(id, ADMIN_KEY)
      setResendResult({ id, ok: true })
    } catch {
      setResendResult({ id, ok: false })
    }
    setResendId(null)
    setTimeout(() => setResendResult(null), 3000)
  }

  const handleDelete = async (id: string) => {
    setDeleteId(id)
    try {
      await deleteAccessRequest(id, ADMIN_KEY)
      await loadRequests()
    } catch { /* ignore */ }
    setDeleteId(null)
    setDeleteConfirm(null)
  }

  const handleUserDelete = async (email: string) => {
    setUserDeleteId(email)
    try {
      await deleteApprovedUser(email, ADMIN_KEY)
      await loadUsers()
    } catch { /* ignore */ }
    setUserDeleteId(null)
    setUserDeleteConfirm(null)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('sqa_admin_verified')
    navigate('/admin/login')
  }

  const filtered = requests.filter(r => filter === 'all' || filter === 'users' || r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="relative min-h-screen" style={{ background: '#080402', color: 'var(--kfp-parchment)' }}>
      {/* Smoke background */}
      <div className="fixed inset-0 z-0 opacity-40">
        <SmokeBackground smokeColor="#100800" />
      </div>
      <div className="fixed inset-0 z-[1]" style={{ background: 'rgba(8,4,2,0.7)' }} />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header
          className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(8,4,2,0.9)', borderBottom: '1px solid rgba(201,162,39,0.2)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐼</span>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em' }}>
                JADE PALACE WAR ROOM
              </p>
              <p className="text-xs" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
                Dragon Warrior Command
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.4)', color: 'var(--kfp-gold)' }}>
                {pendingCount} pending
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded transition-colors"
              style={{ color: 'var(--kfp-text-sec)', border: '1px solid rgba(168,152,128,0.2)', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}
            >
              Depart
            </button>
          </div>
        </header>

        {/* Title */}
        <div className="max-w-5xl mx-auto px-6 pt-12 pb-8 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <SparklesText
              text="Access Scrolls"
              colors={{ first: '#c9a227', second: '#f0c040' }}
              className="text-3xl md:text-5xl"
              sparklesCount={10}
            />
            <p className="mt-3 text-sm" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
              Review and approve warrior access requests.
            </p>
          </motion.div>
        </div>

        {/* Filter tabs */}
        <div className="max-w-5xl mx-auto px-6 mb-8">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-xs px-4 py-2 rounded capitalize transition-all"
                style={{
                  background: filter === f ? 'rgba(201,162,39,0.2)' : 'rgba(26,18,8,0.6)',
                  border: `1px solid ${filter === f ? 'rgba(201,162,39,0.5)' : 'rgba(201,162,39,0.15)'}`,
                  color: filter === f ? 'var(--kfp-gold)' : 'var(--kfp-text-sec)',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.05em',
                }}
              >
                {f} {f === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
              </button>
            ))}
            <button
              onClick={() => { setFilter('users'); loadUsers() }}
              className="text-xs px-4 py-2 rounded capitalize transition-all"
              style={{
                background: filter === 'users' ? 'rgba(239,68,68,0.2)' : 'rgba(26,18,8,0.6)',
                border: `1px solid ${filter === 'users' ? 'rgba(239,68,68,0.5)' : 'rgba(201,162,39,0.15)'}`,
                color: filter === 'users' ? '#ef4444' : 'var(--kfp-text-sec)',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.05em',
              }}
            >
              Active Users {users.length > 0 ? `(${users.length})` : ''}
            </button>
          </div>
        </div>

        {/* ── Users tab ── */}
        {filter === 'users' && (
          <div className="max-w-5xl mx-auto px-6 pb-16">
            {usersLoading ? (
              <div className="text-center py-24">
                <p className="text-sm" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-sm" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>No active users found.</p>
              </div>
            ) : (
              <motion.div
                initial="hidden" animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                className="space-y-3"
              >
                {users.map(u => (
                  <motion.div
                    key={u.id}
                    variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                    className="rounded-lg px-5 py-4 flex items-center justify-between gap-4"
                    style={{ background: 'rgba(26,18,8,0.8)', border: '1px solid rgba(239,68,68,0.15)' }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-heading)' }}>{u.full_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}>active</span>
                      </div>
                      <p className="text-xs font-mono" style={{ color: 'var(--kfp-text-sec)' }}>{u.email}</p>
                      {u.organization && <p className="text-xs mt-0.5" style={{ color: 'rgba(168,152,128,0.5)' }}>{u.organization}</p>}
                    </div>
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                      <RippleButton
                        variant="default"
                        className="px-4 py-2 text-xs font-semibold flex-shrink-0"
                        disabled={userDeleteId === u.email}
                        onClick={() => setUserDeleteConfirm({ email: u.email, name: u.full_name })}
                        style={{ background: 'rgba(80,20,20,0.8)', color: '#f87171', border: '1px solid rgba(139,26,26,0.5)', borderRadius: '4px' } as React.CSSProperties}
                      >
                        {userDeleteId === u.email ? 'Deleting...' : 'Delete User'}
                      </RippleButton>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Request cards */}
        {filter !== 'users' && <div className="max-w-5xl mx-auto px-6 pb-16">
          {loading ? (
            <div className="text-center py-24">
              <p className="text-sm" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
                Retrieving scrolls from the palace archive...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <ScrollIcon size={40} className="mx-auto mb-4" style={{ color: 'var(--kfp-text-sec)', opacity: 0.4 }} strokeWidth={1} />
              <p className="text-sm" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
                No scrolls in this category.
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
              className="space-y-4"
            >
              {filtered.map(req => {
                const badge = statusBadge(req.status)
                const sectorColor = sectorColors[req.sector] ?? 'var(--kfp-gold)'
                return (
                  <motion.div
                    key={req.id}
                    variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                    className="rounded-lg p-6"
                    style={{
                      background: 'rgba(26,18,8,0.8)',
                      border: '1px solid rgba(201,162,39,0.2)',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <h3 className="text-base font-semibold" style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-heading)' }}>
                            {req.full_name}
                          </h3>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}
                          >
                            {badge.label}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `${sectorColor}18`, border: `1px solid ${sectorColor}40`, color: sectorColor, fontFamily: 'var(--font-heading)' }}
                          >
                            {req.sector}
                          </span>
                        </div>
                        <p className="text-sm mb-1" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
                          {req.email} {req.organization && req.organization !== 'N/A' ? `· ${req.organization}` : ''}
                        </p>
                        <p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-body)', opacity: 0.8 }}>
                          {req.purpose}
                        </p>
                        {req.created_at && (
                          <p className="text-xs mt-2" style={{ color: 'rgba(168,152,128,0.4)', fontFamily: 'var(--font-mono)' }}>
                            {new Date(req.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 flex-shrink-0 flex-wrap items-start justify-end">
                        {req.status === 'pending' && (
                          <>
                            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                              <RippleButton
                                variant="default"
                                className="px-4 py-2 text-xs font-semibold"
                                disabled={actionId === req.id}
                                onClick={() => setConfirmModal({ id: req.id, action: 'approve', name: req.full_name })}
                                style={{ background: 'var(--kfp-jade)', color: '#000', border: '1px solid rgba(0,255,136,0.4)', borderRadius: '4px' } as React.CSSProperties}
                              >
                                {actionId === req.id ? '...' : 'Approve'}
                              </RippleButton>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                              <RippleButton
                                variant="default"
                                className="px-4 py-2 text-xs font-semibold"
                                disabled={actionId === req.id}
                                onClick={() => setConfirmModal({ id: req.id, action: 'reject', name: req.full_name })}
                                style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(139,26,26,0.5)', borderRadius: '4px' } as React.CSSProperties}
                              >
                                Reject
                              </RippleButton>
                            </motion.div>
                          </>
                        )}

                        {req.status === 'approved' && (
                          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                            <RippleButton
                              variant="default"
                              className="px-4 py-2 text-xs font-semibold"
                              disabled={resendId === req.id}
                              onClick={() => handleResendEmail(req.id)}
                              style={{ background: 'transparent', color: resendResult?.id === req.id ? (resendResult.ok ? '#00ff88' : '#ef4444') : 'var(--kfp-gold)', border: `1px solid ${resendResult?.id === req.id ? (resendResult.ok ? 'rgba(0,255,136,0.4)' : 'rgba(239,68,68,0.4)') : 'rgba(201,162,39,0.4)'}`, borderRadius: '4px' } as React.CSSProperties}
                            >
                              {resendId === req.id ? '...' : resendResult?.id === req.id ? (resendResult.ok ? 'Sent' : 'Failed') : 'Resend Email'}
                            </RippleButton>
                          </motion.div>
                        )}

                        {/* Delete button — available for all statuses */}
                        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                          <RippleButton
                            variant="default"
                            className="px-4 py-2 text-xs font-semibold"
                            disabled={deleteId === req.id}
                            onClick={() => setDeleteConfirm({ id: req.id, name: req.full_name })}
                            style={{ background: 'transparent', color: 'rgba(168,152,128,0.6)', border: '1px solid rgba(168,152,128,0.2)', borderRadius: '4px' } as React.CSSProperties}
                          >
                            {deleteId === req.id ? '...' : 'Delete'}
                          </RippleButton>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>}
      </div>

      {/* Approved Credentials Modal */}
      <AnimatePresence>
        {approvedCreds && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.85)' }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md p-8 rounded-lg"
              style={{ background: 'radial-gradient(ellipse, #0a1a0a 0%, #040a04 100%)', border: '1px solid rgba(0,255,136,0.3)', boxShadow: '0 0 60px rgba(0,255,136,0.1)' }}
            >
              <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color: '#00ff88' }} strokeWidth={1.5} />
              <h3 className="text-lg text-center mb-1" style={{ color: '#00ff88', fontFamily: 'var(--font-heading)' }}>Access Granted</h3>
              <p className="text-xs text-center mb-6" style={{ color: 'rgba(168,152,128,0.6)', fontFamily: 'var(--font-body)' }}>
                Share these credentials with {approvedCreds.name}
              </p>
              <div className="space-y-3 mb-6">
                <div className="p-3 rounded" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}>
                  <p className="text-xs mb-1" style={{ color: 'rgba(0,255,136,0.5)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em' }}>EMAIL</p>
                  <p className="text-sm font-mono" style={{ color: 'var(--kfp-parchment)' }}>{approvedCreds.email}</p>
                </div>
                <div className="p-3 rounded" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}>
                  <p className="text-xs mb-1" style={{ color: 'rgba(0,255,136,0.5)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em' }}>TEMP PASSWORD</p>
                  <p className="text-sm font-mono font-bold" style={{ color: '#00ff88' }}>{approvedCreds.password}</p>
                </div>
              </div>
              <p className="text-xs text-center mb-4" style={{ color: 'rgba(168,152,128,0.4)', fontFamily: 'var(--font-body)' }}>
                Login URL: <span style={{ color: 'var(--kfp-gold)' }}>localhost:5173/login</span>
              </p>
              <button
                onClick={() => setApprovedCreds(null)}
                className="w-full py-2.5 text-sm rounded font-semibold"
                style={{ background: 'var(--kfp-jade)', color: '#000', border: '1px solid rgba(0,255,136,0.4)', fontFamily: 'var(--font-heading)' }}
              >
                Got it — Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={() => setConfirmModal(null)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm p-8 rounded-lg text-center"
              style={{
                background: 'radial-gradient(ellipse, #2a1f0a 0%, #0f0b05 100%)',
                border: '1px solid var(--kfp-border)',
                boxShadow: '0 0 60px rgba(201,162,39,0.12)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {confirmModal.action === 'approve'
                ? <CheckCircle2 size={36} className="mb-4" style={{ color: '#00ff88' }} strokeWidth={1.5} />
                : <XCircle size={36} className="mb-4" style={{ color: '#ef4444' }} strokeWidth={1.5} />}
              <h3 className="text-lg mb-2" style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-heading)' }}>
                {confirmModal.action === 'approve' ? 'Grant Access' : 'Deny Access'}
              </h3>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
                {confirmModal.action === 'approve'
                  ? `Grant ${confirmModal.name} access to the Jade Palace?`
                  : `Reject ${confirmModal.name}'s scroll? This cannot be undone.`}
              </p>
              <div className="flex gap-3 justify-center">
                <RippleButton
                  variant="default"
                  className="px-5 py-2.5 text-sm font-semibold"
                  disabled={actionId === confirmModal.id}
                  onClick={() => handleAction(confirmModal.id, confirmModal.action)}
                  style={{
                    background: confirmModal.action === 'approve' ? 'var(--kfp-jade)' : 'var(--kfp-red)',
                    color: confirmModal.action === 'approve' ? '#000' : 'var(--kfp-parchment)',
                    border: '1px solid transparent',
                    borderRadius: '4px',
                  } as React.CSSProperties}
                >
                  {actionId === confirmModal.id ? 'Processing...' : 'Confirm'}
                </RippleButton>
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-5 py-2.5 text-sm rounded"
                  style={{ color: 'var(--kfp-text-sec)', border: '1px solid rgba(168,152,128,0.2)', fontFamily: 'var(--font-body)' }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Delete Confirm Modal */}
      <AnimatePresence>
        {userDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={() => setUserDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm p-8 rounded-lg text-center"
              style={{ background: 'radial-gradient(ellipse, #1a0808 0%, #0a0404 100%)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 0 40px rgba(239,68,68,0.1)' }}
              onClick={e => e.stopPropagation()}
            >
              <XCircle size={36} className="mb-4 mx-auto" style={{ color: '#ef4444' }} strokeWidth={1.5} />
              <h3 className="text-lg mb-1" style={{ color: '#ef4444', fontFamily: 'var(--font-heading)' }}>Delete User</h3>
              <p className="text-sm mb-2" style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-heading)' }}>{userDeleteConfirm.name}</p>
              <p className="text-xs mb-6 leading-relaxed" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
                This will remove <span className="font-mono text-red-400">{userDeleteConfirm.email}</span> from approved users and revoke their login access. Cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <RippleButton
                  variant="default"
                  className="px-5 py-2.5 text-sm font-semibold"
                  disabled={userDeleteId === userDeleteConfirm.email}
                  onClick={() => handleUserDelete(userDeleteConfirm.email)}
                  style={{ background: 'rgba(139,26,26,0.8)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '4px' } as React.CSSProperties}
                >
                  {userDeleteId === userDeleteConfirm.email ? 'Deleting...' : 'Delete'}
                </RippleButton>
                <button
                  onClick={() => setUserDeleteConfirm(null)}
                  className="px-5 py-2.5 text-sm rounded"
                  style={{ color: 'var(--kfp-text-sec)', border: '1px solid rgba(168,152,128,0.2)', fontFamily: 'var(--font-body)' }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm p-8 rounded-lg text-center"
              style={{ background: 'radial-gradient(ellipse, #1a0a0a 0%, #0a0404 100%)', border: '1px solid rgba(168,152,128,0.2)', boxShadow: '0 0 40px rgba(0,0,0,0.6)' }}
              onClick={e => e.stopPropagation()}
            >
              <XCircle size={36} className="mb-4 mx-auto" style={{ color: 'rgba(168,152,128,0.5)' }} strokeWidth={1.5} />
              <h3 className="text-lg mb-2" style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-heading)' }}>
                Delete Scroll
              </h3>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-body)' }}>
                Permanently delete {deleteConfirm.name}'s scroll and remove their access? This cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <RippleButton
                  variant="default"
                  className="px-5 py-2.5 text-sm font-semibold"
                  disabled={deleteId === deleteConfirm.id}
                  onClick={() => handleDelete(deleteConfirm.id)}
                  style={{ background: 'rgba(80,20,20,0.8)', color: '#f87171', border: '1px solid rgba(139,26,26,0.5)', borderRadius: '4px' } as React.CSSProperties}
                >
                  {deleteId === deleteConfirm.id ? 'Deleting...' : 'Delete'}
                </RippleButton>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-5 py-2.5 text-sm rounded"
                  style={{ color: 'var(--kfp-text-sec)', border: '1px solid rgba(168,152,128,0.2)', fontFamily: 'var(--font-body)' }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
