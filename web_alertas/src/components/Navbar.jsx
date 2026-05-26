import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Menu, Shield, X } from 'lucide-react'
import { CTA_PATH, NAV_ITEMS } from '../config/navigation'

function navLinkClass({ isActive }) {
  return [
    'inline-flex items-center justify-center',
    'px-5 xl:px-7 py-3 rounded-full',
    'text-[15px] xl:text-base font-medium whitespace-nowrap',
    'transition-all duration-200',
    isActive
      ? 'bg-white text-teal-900 font-semibold shadow-sm ring-1 ring-zinc-200/80'
      : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/70',
  ].join(' ')
}

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/98 backdrop-blur-md border-b border-zinc-200 shadow-sm">
      <div className="h-[4.75rem] xl:h-[5.75rem]">
        <div className="mx-auto w-full max-w-[1600px] h-full px-6 sm:px-10 xl:px-16 flex items-center">
          {/* Logo — bloque fijo a la izquierda */}
          <Link
            to="/"
            className="flex items-center gap-3 shrink-0 min-w-[140px] xl:min-w-[160px]"
            onClick={() => setOpen(false)}
          >
            <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-xl bg-zinc-900 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-lg xl:text-xl font-semibold text-zinc-900 tracking-tight">
              Alertas
            </span>
          </Link>

          {/* Navegación central — mucho espacio entre enlaces */}
          <nav
            className="hidden xl:flex flex-1 items-center justify-center px-10 2xl:px-16"
            aria-label="Secciones principales"
          >
            <div className="inline-flex items-center gap-3 2xl:gap-4 p-2.5 rounded-2xl bg-zinc-100/90 border border-zinc-200">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={navLinkClass}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Acciones — separadas del menú con borde */}
          <div className="hidden xl:flex items-center gap-8 shrink-0 pl-10 ml-4 border-l border-zinc-200 min-w-[220px] justify-end">
            <NavLink
              to="/mapa"
              className="text-base font-medium text-zinc-600 hover:text-teal-800 transition-colors whitespace-nowrap"
            >
              Ver demo
            </NavLink>
            <NavLink to={CTA_PATH} className="btn-accent rounded-xl text-base py-3.5 px-8 whitespace-nowrap">
              Descargar
            </NavLink>
          </div>

          {/* Tablet: menú compacto con más aire */}
          <nav className="hidden lg:flex xl:hidden flex-1 items-center justify-center gap-6 px-6">
            {NAV_ITEMS.slice(0, 4).map((item) => (
              <NavLink key={item.path} to={item.path} end={item.end} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex xl:hidden items-center gap-4 shrink-0">
            <NavLink to={CTA_PATH} className="btn-accent rounded-lg text-sm py-2.5 px-5">
              Descargar
            </NavLink>
          </div>

          <button
            type="button"
            className="lg:hidden ml-auto p-2.5 rounded-xl text-zinc-800 hover:bg-zinc-100"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-zinc-200 bg-white px-6 py-6 shadow-elevated">
          <nav className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'px-5 py-3.5 rounded-xl text-base font-medium transition-colors',
                    isActive
                      ? 'bg-teal-50 text-teal-900 font-semibold'
                      : 'text-zinc-700 hover:bg-zinc-50',
                  ].join(' ')
                }
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-4 mt-2 border-t border-zinc-100 flex flex-col gap-3">
              <NavLink
                to="/mapa"
                className="px-5 py-3 text-base font-medium text-zinc-700"
                onClick={() => setOpen(false)}
              >
                Ver demo
              </NavLink>
              <NavLink
                to={CTA_PATH}
                className="btn-accent justify-center rounded-xl py-3.5 text-base"
                onClick={() => setOpen(false)}
              >
                Descargar app
              </NavLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
