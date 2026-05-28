import { api } from './apiClient'

export async function getAllReports(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.append(k, v)
  })
  const query = qs.toString()
  return api.get(query ? `/reports?${query}` : '/reports')
}

export async function getNearbyReports(latitude, longitude, radius = 5000) {
  return api.get(`/reports/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`)
}

export async function getReportById(id) {
  return api.get(`/reports/${id}`)
}

export async function verifyReport(id) {
  return api.patch(`/reports/${id}/verify`)
}

export async function deleteReport(id) {
  return api.delete(`/reports/${id}`)
}

export async function getReportsByUser(userId) {
  return api.get(`/reports/user/${userId}`)
}

export async function createReport(formData) {
  return api.post('/reports', formData)
}
