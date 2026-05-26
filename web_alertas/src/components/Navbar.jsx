import { useState } from 'react'
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
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, role, logout } = useAuth()

  const roleNav = isAuthenticated ? getNavForRole(role) : []

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
    <header className="fixed top-0 inset-x-0 z-50 nav-blur">
      <div className="container-main h-16 flex items-center justify-between gap-6">
        <Link
          to={isAuthenticated ? '/mapa' : '/'}
          className="flex items-center gap-2.5 shrink-0"
          onClick={() => setOpen(false)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--btn-primary-bg)]">
            <Shield className="h-4 w-4 text-[var(--btn-primary-fg)]" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-[var(--ink)]">Alertas</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {isHome && !isAuthenticated
            ? LANDING_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSectionClick(section.id)}
                  className="nav-link"
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

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <span className="text-xs font-medium text-[var(--muted)] max-w-[140px] truncate hidden lg:inline">
                {user?.first_name} · {role?.name || 'usuario'}
              </span>
              <button type="button" onClick={handleLogout} className="btn-secondary !h-9 !px-3 text-[13px]">
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">
                Iniciar sesión
              </NavLink>
              <NavLink to={CTA_PATH} className="btn-primary !h-9 !px-4 text-[13px]">
                Descargar
              </NavLink>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden p-2 -mr-2 rounded-lg text-[var(--body)] hover:bg-[var(--surface-hover)]"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--elevated)] px-6 py-5">
          <nav className="flex flex-col gap-1">
            {isHome && !isAuthenticated &&
              LANDING_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSectionClick(section.id)}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--body)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                >
                  {section.label}
                </button>
              ))}
            {isAuthenticated
              ? roleNav.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--body)] hover:bg-[var(--surface-hover)]"
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
            <div className="mt-4 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
              <div className="flex justify-center pb-2">
                <ThemeToggle />
              </div>
              {isAuthenticated ? (
                <button type="button" onClick={handleLogout} className="btn-secondary justify-center">
                  Cerrar sesión
                </button>
              ) : (
                <NavLink to={CTA_PATH} className="btn-primary justify-center" onClick={() => setOpen(false)}>
                  Descargar
                </NavLink>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
