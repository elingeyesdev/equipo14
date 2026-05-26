import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = '••••••••',
  required = true,
  autoComplete = 'current-password',
  className = '',
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="auth-label">
          {label}
        </label>
      )}
      <div className="input-icon-field">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="auth-input auth-input--no-icon !pr-12"
        />
        <motion.button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 z-[3] -translate-y-1/2 p-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          whileTap={{ scale: 0.92 }}
        >
          <motion.span
            key={visible ? 'hide' : 'show'}
            initial={{ opacity: 0, rotate: -8 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 0.15 }}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </motion.span>
        </motion.button>
      </div>
    </div>
  )
}
