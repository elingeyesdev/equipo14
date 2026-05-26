import PageContainer from './PageContainer'

/**
 * Contenedor estándar para páginas del panel (mapa, admin, métricas).
 */
export default function DashboardPageShell({ children, className = '' }) {
  return (
    <div className={`dashboard-page ${className}`.trim()}>
      <PageContainer className="dashboard-inner">{children}</PageContainer>
    </div>
  )
}

export function DashboardPageHeader({ title, description, actions }) {
  return (
    <header className="dashboard-header">
      <div className="min-w-0 flex-1">
        <h1 className="dashboard-title">{title}</h1>
        {description && <p className="dashboard-description">{description}</p>}
      </div>
      {actions && <div className="dashboard-header-actions">{actions}</div>}
    </header>
  )
}
