import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './layouts/Layout'
import ProtectedAppLayout from './layouts/ProtectedAppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import MapaPage from './pages/MapaPage'
import MetricasPage from './pages/MetricasPage'
import DescargaPage from './pages/DescargaPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import ReportesPage from './pages/ReportesPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="descarga" element={<DescargaPage />} />
            <Route path="login" element={<LoginPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <ProtectedAppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="metricas" element={<MetricasPage />} />
              <Route path="mapa" element={<MapaPage />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute authorityOnly>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reportes"
                element={
                  <ProtectedRoute authorityOnly>
                    <ReportesPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
