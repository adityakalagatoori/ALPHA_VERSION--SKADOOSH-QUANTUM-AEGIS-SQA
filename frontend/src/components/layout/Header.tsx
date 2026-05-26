import { Link } from 'react-router-dom'
import { Shield, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import useSecurityFeed from '../../hooks/useSecurityFeed'

export default function Header() {
  const { user, signOut } = useAuth()
  const { connected } = useSecurityFeed()

  return (
    <header className="h-16 border-b border-white/5 bg-[#0a1628] flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <Shield size={20} className="text-cyan-400" />
          <h1 className="text-lg font-black text-white tracking-widest">SQA Command Center</h1>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 text-xs font-mono ${connected ? 'text-green-400' : 'text-red-400'}`}>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {connected ? 'System Live' : 'Disconnected'}
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        ) : (
          <Link to="/login" className="text-xs text-cyan-400 hover:text-cyan-300 transition border border-cyan-500/20 px-3 py-1.5 rounded-lg">
            Sign In
          </Link>
        )}
      </div>
    </header>
  )
}
