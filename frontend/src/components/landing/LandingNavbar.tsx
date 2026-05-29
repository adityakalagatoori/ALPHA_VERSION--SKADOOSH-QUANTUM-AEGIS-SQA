import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RippleButton } from '@/components/ui/multi-type-ripple-buttons'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'

const navLinks = [
  { label: 'Why SQA',     href: '#why-sqa' },
  { label: 'Features',    href: '#features' },
  { label: 'Sectors',     href: '#sectors' },
  { label: 'How It Works', href: '#how-it-works' },
]

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(10,8,6,0.95)'
          : 'rgba(10,8,6,0.6)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid rgba(201,162,39,0.25)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full border-2 overflow-hidden flex-shrink-0"
            style={{ borderColor: 'var(--kfp-gold)', boxShadow: '0 0 12px rgba(201,162,39,0.45)' }}>
            <img src="/sqa-logo.png" alt="SQA" className="w-full h-full object-cover" />
          </div>
          <span className="font-display text-sm tracking-widest hidden sm:block" style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-display)' }}>
            SQA
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm tracking-wide transition-colors hover:opacity-100"
              style={{ color: 'var(--kfp-text-sec)', fontFamily: 'var(--font-heading)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--kfp-gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--kfp-text-sec)')}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <a href="/login">
            <RippleButton
              variant="ghost"
              className="text-sm px-5 py-2"
              style={{ color: 'var(--kfp-gold)', border: '1px solid rgba(201,162,39,0.4)', borderRadius: '4px' } as React.CSSProperties}
            >
              Log In
            </RippleButton>
          </a>
          <a href="#request-access">
            <RippleButton
              variant="hoverborder"
              hoverBorderEffectColor="rgba(0,255,136,0.6)"
              className="text-sm px-5 py-2"
              style={{ color: 'var(--kfp-jade-bright)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '4px' } as React.CSSProperties}
            >
              Request Access
            </RippleButton>
          </a>
        </div>

        {/* Mobile menu */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 rounded border" style={{ borderColor: 'var(--kfp-border)', color: 'var(--kfp-parchment)' }}>
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72" style={{ background: 'var(--kfp-surface)', borderColor: 'var(--kfp-border)' }}>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2" style={{ color: 'var(--kfp-gold)', fontFamily: 'var(--font-display)' }}>
                  <img src="/sqa-logo.png" alt="SQA" className="w-8 h-8 rounded-full object-cover" style={{ boxShadow: '0 0 8px rgba(201,162,39,0.5)' }} />
                  SQA
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-1">
                {navLinks.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="py-3 px-4 rounded text-base transition-colors"
                    style={{ color: 'var(--kfp-parchment)', fontFamily: 'var(--font-body)' }}
                  >
                    {link.label}
                  </a>
                ))}
                <hr style={{ borderColor: 'var(--kfp-border)', margin: '12px 0' }} />
                <a href="/login" className="py-3 px-4 text-base" style={{ color: 'var(--kfp-gold)' }}>Log In</a>
                <a href="#request-access" className="py-3 px-4 text-base" style={{ color: 'var(--kfp-jade-bright)' }}>Request Access</a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  )
}
