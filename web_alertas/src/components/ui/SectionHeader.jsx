import { FadeUp } from './Animate'

export default function SectionHeader({
  label,
  title,
  description,
  align = 'left',
  dark = false,
  className = '',
}) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left'

  return (
    <FadeUp className={`max-w-3xl mb-12 lg:mb-16 ${alignClass} ${className}`}>
      {label && (
        <p className={`label-pill mb-5 inline-flex ${dark ? 'label-pill-light' : 'label-pill-accent'}`}>
          {label}
        </p>
      )}
      <h2
        className={`text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-semibold leading-[1.1] tracking-tight ${
          dark ? 'text-white' : 'text-zinc-900'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-5 text-lg lg:text-xl leading-relaxed max-w-2xl ${
            align === 'center' ? 'mx-auto' : ''
          } ${dark ? 'text-zinc-200' : 'text-body'}`}
        >
          {description}
        </p>
      )}
    </FadeUp>
  )
}
