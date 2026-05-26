import PremiumHero from '../components/landing/PremiumHero'
import PremiumBenefits from '../components/landing/PremiumBenefits'
import PremiumMap from '../components/landing/PremiumMap'
import PremiumTech from '../components/landing/PremiumTech'
import PremiumTestimonials from '../components/landing/PremiumTestimonials'
import PremiumStats from '../components/landing/PremiumStats'
import PremiumCTA from '../components/landing/PremiumCTA'

export default function HomePage() {
  return (
    <div className="w-full bg-[var(--surface)]">
      <PremiumHero />
      <PremiumBenefits />
      <PremiumMap />
      <PremiumTech />
      <PremiumTestimonials />
      <PremiumStats />
      <PremiumCTA />
    </div>
  )
}
