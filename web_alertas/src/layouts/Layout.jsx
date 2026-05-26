import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Layout() {
  const { pathname, hash } = useLocation()
  const isHome = pathname === '/'

  useEffect(() => {
    if (hash && isHome) {
      const id = hash.slice(1)
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      })
      return
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, hash, isHome])

  useEffect(() => {
    const root = document.documentElement
    if (isHome) {
      root.classList.add('home-snap')
    } else {
      root.classList.remove('home-snap')
    }
    return () => root.classList.remove('home-snap')
  }, [isHome])

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface)]">
      <Navbar isHome={isHome} />
      <main className={`flex-1 ${isHome ? '' : 'pt-16 md:pt-20'}`}>
        <Outlet />
      </main>
      {!isHome && <Footer />}
    </div>
  )
}
