import { motion } from 'framer-motion'

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  className = '',
}) {
  const centered = align === 'center'

  return (
    <div className={`max-w-xl ${centered ? 'mx-auto text-center' : ''} ${className}`}>
      {eyebrow && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
          className="eyebrow mb-4"
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.04 }}
        className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-[var(--ink)] leading-[1.1]"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className={`mt-4 text-base text-[var(--body)] leading-[1.7] ${centered ? 'mx-auto' : ''} max-w-lg`}
        >
          {description}
        </motion.p>
      )}
    </div>
  )
}
