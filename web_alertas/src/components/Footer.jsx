import { Link } from 'react-router-dom'
import { Shield, Code2, MessageCircle, Camera, Mail, ExternalLink } from 'lucide-react'
import { CTA_PATH } from '../config/navigation'

const product = [
  { label: 'Mapa en vivo',     to: '/login'    },
  { label: 'Descargar app',    to: CTA_PATH    },
  { label: 'Cómo funciona',   to: '/#como-funciona' },
  { label: 'Características', to: '/#beneficios'    },
  { label: 'Testimonios',     to: '/#testimonios'   },
]

const resources = [
  { label: 'Documentación',  href: '#', ext: true  },
  { label: 'API Reference',  href: '#', ext: true  },
  { label: 'GitHub',         href: '#', ext: true  },
  { label: 'Changelog',      href: '#', ext: false },
  { label: 'Status',         href: '#', ext: false },
]

const company = [
  { label: 'Sobre nosotros', href: '#'   },
  { label: 'Blog',           href: '#'   },
  { label: 'Prensa',         href: '#'   },
  { label: 'Contacto',       href: '#'   },
]

const legal = [
  { label: 'Privacidad',   href: '#' },
  { label: 'Términos',     href: '#' },
  { label: 'Cookies',      href: '#' },
  { label: 'Seguridad',    href: '#' },
]

const socials = [
  { label: 'GitHub',    href: '#', Icon: Code2          },
  { label: 'Twitter',   href: '#', Icon: MessageCircle  },
  { label: 'Instagram', href: '#', Icon: Camera         },
  { label: 'Email',     href: '#', Icon: Mail           },
]

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="text-[11px] font-bold text-[var(--ink)] uppercase tracking-[0.08em] mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map(link => (
          <li key={link.label}>
            {link.to ? (
              <Link to={link.to} className="text-[13px] text-[var(--body)] hover:text-[var(--accent)] transition-colors flex items-center gap-1">
                {link.label}
              </Link>
            ) : (
              <a href={link.href} target={link.ext ? '_blank' : undefined} rel={link.ext ? 'noopener noreferrer' : undefined}
                className="text-[13px] text-[var(--body)] hover:text-[var(--accent)] transition-colors flex items-center gap-1">
                {link.label}
                {link.ext && <ExternalLink className="h-2.5 w-2.5 opacity-40" strokeWidth={2}/>}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--elevated)]">
      <div className="container-main py-14 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--btn-primary-bg)] transition-transform group-hover:scale-105">
                <Shield className="h-4 w-4 text-[var(--btn-primary-fg)]" strokeWidth={2.5}/>
              </div>
              <span className="text-[15px] font-bold tracking-tight text-[var(--ink)]">Alertas</span>
            </Link>
            <p className="text-[13px] text-[var(--body)] leading-relaxed max-w-[240px]">
              La plataforma de inteligencia urbana y seguridad ciudadana en tiempo real.
            </p>
            {/* Socials */}
            <div className="mt-5 flex items-center gap-2">
              {socials.map(({ label, href, Icon }) => (
                <a key={label} href={href} aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] transition-all duration-200">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75}/>
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Producto"   links={product}   />
          <FooterCol title="Recursos"   links={resources} />
          <FooterCol title="Empresa"    links={company}   />
          <FooterCol title="Legal"      links={legal}     />
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[12px] text-[var(--muted)]">
            © {new Date().getFullYear()} Alertas. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-[var(--accent)] font-semibold">Hecho con ♥ en Bolivia.</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"/>
                <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500"/>
              </span>
              <span className="text-[11px] text-emerald-500 font-semibold">Todos los sistemas operativos</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
