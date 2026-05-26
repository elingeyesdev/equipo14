import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--elevated)] text-[var(--ink)] transition-colors hover:bg-[var(--surface-hover)] ${className}`}
      aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? <Sun className="h-4 w-4" strokeWidth={2} /> : <Moon className="h-4 w-4" strokeWidth={2} />}
    </button>
  )
}
