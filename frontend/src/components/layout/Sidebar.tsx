import { Link, useLocation } from 'react-router-dom'
import { Shield, LayoutDashboard, Terminal, Settings, Home } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/demo', label: 'Live Demo', icon: Terminal },
  { to: '/admin', label: 'Admin Panel', icon: Settings },
  { to: '/', label: 'Home', icon: Home },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 bg-[#0a1628] border-r border-white/5 p-5 flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
          <Shield size={16} className="text-black" />
        </div>
        <div>
          <h2 className="text-lg font-black text-cyan-400 tracking-widest">SQA</h2>
          <p className="text-xs text-gray-600">Dragon Warrior</p>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 p-3 rounded-xl font-medium text-sm transition ${
                active
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="text-xs text-gray-600 font-mono">v2.0.0 · PQ-AI Security</div>
      </div>
    </aside>
  )
}
