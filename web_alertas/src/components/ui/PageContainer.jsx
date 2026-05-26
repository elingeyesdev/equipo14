export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`w-full max-w-[1400px] mx-auto px-6 lg:px-12 ${className}`}>
      {children}
    </div>
  )
}
