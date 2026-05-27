import PremiumHero from '../components/landing/PremiumHero'
import KPISection from '../components/landing/KPISection'
import TrustLogos from '../components/landing/TrustLogos'
import PremiumBenefits from '../components/landing/PremiumBenefits'
import HowItWorks from '../components/landing/HowItWorks'
import PremiumMap from '../components/landing/PremiumMap'
import PremiumTech from '../components/landing/PremiumTech'
import PremiumTestimonials from '../components/landing/PremiumTestimonials'
import FAQ from '../components/landing/FAQ'
import PremiumCTA from '../components/landing/PremiumCTA'

export default function HomePage() {
  return (
    <div className="w-full bg-[var(--surface)]">
      {/* 1. Hero — impacto inmediato */}
      <PremiumHero />

      {/* 2. KPIs — prueba social con números */}
      <KPISection />

      {/* 3. Confianza — organizaciones */}
      <TrustLogos />

      {/* 4. Features — 6 cards premium */}
      <PremiumBenefits />

      {/* 5. Cómo funciona — 4 pasos */}
      <HowItWorks />

      {/* 6. Mapa en vivo — demostración real */}
      <PremiumMap />

      {/* 7. Arquitectura — diagrama técnico */}
      <PremiumTech />

      {/* 8. Testimonios — LinkedIn style */}
      <PremiumTestimonials />

      {/* 9. FAQ — preguntas frecuentes */}
      <FAQ />

      {/* 10. CTA Final — ultra impactante */}
      <PremiumCTA />
    </div>
  )
}
