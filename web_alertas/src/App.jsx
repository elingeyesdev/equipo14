import { Routes, Route } from 'react-router-dom'
import Layout from './layouts/Layout'
import HomePage from './pages/HomePage'
import ProductoPage from './pages/ProductoPage'
import ComoFuncionaPage from './pages/ComoFuncionaPage'
import MapaPage from './pages/MapaPage'
import TecnologiaPage from './pages/TecnologiaPage'
import MetricasPage from './pages/MetricasPage'
import TestimoniosPage from './pages/TestimoniosPage'
import DescargaPage from './pages/DescargaPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="producto" element={<ProductoPage />} />
        <Route path="como-funciona" element={<ComoFuncionaPage />} />
        <Route path="mapa" element={<MapaPage />} />
        <Route path="tecnologia" element={<TecnologiaPage />} />
        <Route path="metricas" element={<MetricasPage />} />
        <Route path="testimonios" element={<TestimoniosPage />} />
        <Route path="descarga" element={<DescargaPage />} />
      </Route>
    </Routes>
  )
}
