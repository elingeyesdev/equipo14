import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface)]">
      <Navbar />
      <main className="flex-1 pt-[4.75rem] xl:pt-[5.75rem]">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
