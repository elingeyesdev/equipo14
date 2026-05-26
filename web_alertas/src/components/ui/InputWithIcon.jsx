/**
 * Campo de texto con ícono a la izquierda (sin solapar el texto).
 */
export default function InputWithIcon({
  id,
  label,
  icon: Icon,
  className = '',
  inputClassName = '',
  ...inputProps
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="auth-label">
          {label}
        </label>
      )}
      <div className="input-icon-field">
        {Icon && (
          <span className="input-icon-slot" aria-hidden>
            <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
          </span>
        )}
        <input id={id} className={`auth-input ${inputClassName}`.trim()} {...inputProps} />
      </div>
    </div>
  )
}
