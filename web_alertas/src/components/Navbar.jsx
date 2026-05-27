import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Shield, X, LogOut } from 'lucide-react'
import { CTA_PATH, LANDING_SECTIONS, scrollToLandingSection } from '../config/navigation'
import { getNavForRole } from '../config/roles'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

function navLinkClass({ isActive }) {
  return `nav-link ${isActive ? '!text-[var(--ink)] font-semibold' : ''}`
}

export default function Navbar({ isHome = false }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, role, logout } = useAuth()
  const roleNav = isAuthenticated ? getNavForRole(role) : []

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSectionClick = (id) => {
    setOpen(false)
    if (location.pathname === '/') {
      scrollToLandingSection(id)
    } else {
      window.location.href = `/#${id}`
    }
  }

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate('/login')
  }

  return (
    <header className={`fixed top-0 inset-x-0 z-50 nav-blur${scrolled ? ' scrolled' : ''}`}>
      <div className="container-main h-[3.75rem] flex items-center justify-between gap-6">
        {/* Logo */}
        <Link
          to={isAuthenticated ? '/mapa' : '/'}
          className="flex items-center gap-2 shrink-0 group"
          onClick={() => setOpen(false)}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--btn-primary-bg)] transition-transform group-hover:scale-105">
            <Shield className="h-3.5 w-3.5 text-[var(--btn-primary-fg)]" strokeWidth={2.5} />
          </div>
          <span className="text-[14px] font-bold tracking-tight text-[var(--ink)]">Alertas</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 flex-1 justify-center">
          {isHome && !isAuthenticated
            ? LANDING_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSectionClick(section.id)}
                  className="nav-link text-[13px]"
                >
                  {section.label}
                </button>
              ))
            : null}
          {isAuthenticated
            ? roleNav.map((item) => (
                <NavLink key={item.path} to={item.path} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))
            : !isHome && (
                <NavLink to="/" className={navLinkClass}>
                  Inicio
                </NavLink>
              )}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <span className="text-xs font-medium text-[var(--muted)] max-w-[140px] truncate hidden lg:inline">
                {user?.first_name} · {role?.name || 'usuario'}
              </span>
              <button type="button" onClick={handleLogout} className="btn-secondary !h-8 !px-3 text-[13px]">
                <LogOut className="h-3.5 w-3.5" />
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link text-[13px] font-medium">
                Iniciar sesión
              </NavLink>
              <NavLink to={CTA_PATH} className="btn-primary !h-8 !px-4 text-[13px]">
                Descargar
              </NavLink>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden p-2 -mr-1 rounded-lg text-[var(--body)] hover:bg-[var(--surface-hover)] transition-colors"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--elevated)] px-5 py-4">
          <nav className="flex flex-col gap-0.5">
            {isHome && !isAuthenticated &&
              LANDING_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSectionClick(section.id)}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--body)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] transition-colors"
                >
                  {section.label}
                </button>
              ))}
            {isAuthenticated
              ? roleNav.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--body)] hover:bg-[var(--surface-hover)] transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))
              : (
                <NavLink to="/login" className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--body)]" onClick={() => setOpen(false)}>
                  Iniciar sesión
                </NavLink>
              )}
            <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-3">
              <div className="flex justify-between items-center pb-1">
                <span className="text-xs text-[var(--muted)]">Tema</span>
                <ThemeToggle />
              </div>
              {isAuthenticated ? (
                <button type="button" onClick={handleLogout} className="btn-secondary justify-center">
                  Cerrar sesión
                </button>
              ) : (
                <NavLink to={CTA_PATH} className="btn-primary justify-center" onClick={() => setOpen(false)}>
                  Descargar app
                </NavLink>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
