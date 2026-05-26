import { Outlet } from 'react-router-dom'
import { ReportFilterProvider } from '../context/ReportFilterContext'

/** Layout para rutas autenticadas con filtros compartidos entre mapa, métricas y admin */
export default function ProtectedAppLayout() {
  return (
    <ReportFilterProvider>
      <Outlet />
    </ReportFilterProvider>
  )
}
