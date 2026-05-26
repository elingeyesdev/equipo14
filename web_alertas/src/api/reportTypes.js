import { api } from './apiClient'

export async function getReportTypes() {
  return api.get('/report-types')
}

export async function createReportType(name) {
  return api.post('/report-types', { name })
}

export async function deleteReportType(id) {
  return api.delete(`/report-types/${id}`)
}
