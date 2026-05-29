import ShaderBackground from '@/components/ui/shader-background'
import { SparklesCore } from '@/components/ui/sparkles'
import LandingNavbar from '@/components/landing/LandingNavbar'
import Hero from '@/components/landing/Hero'
import StatsSection from '@/components/landing/StatsSection'
import FeatureSection from '@/components/landing/FeatureSection'
import ThreatSection from '@/components/landing/ThreatSection'
import SectorDefense from '@/components/landing/SectorDefense'
import HowItWorks from '@/components/landing/HowItWorks'
import RequestAccess from '@/components/landing/RequestAccess'
import FaqSection from '@/components/landing/FaqSection'
import Footer from '@/components/landing/Footer'
import SystemArchViz from '@/components/landing/SystemArchViz'
import SDKShowcase from '@/components/landing/SDKShowcase'
import QuantumUrgency from '@/components/landing/QuantumUrgency'

export default function Landing() {
  return (
    <div className="relative min-h-screen" style={{ background: 'var(--kfp-black)', color: 'var(--kfp-parchment)' }}>
      {/* WebGL plasma grid base */}
      <ShaderBackground />

      {/* Gold ember particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <SparklesCore
          background="transparent"
          particleColor="#c9a227"
          particleDensity={18}
          speed={0.4}
          minSize={0.4}
          maxSize={1.2}
          className="w-full h-full"
        />
      </div>

      {/* Page content */}
      <div className="relative z-10">
        <LandingNavbar />
        <Hero />
        <QuantumUrgency />
        <StatsSection />
        <FeatureSection />
        <SystemArchViz />
        <ThreatSection />
        <SectorDefense />
        <HowItWorks />
        <SDKShowcase />
        <RequestAccess />
        <FaqSection />
        <Footer />
      </div>
    </div>
  )
}
