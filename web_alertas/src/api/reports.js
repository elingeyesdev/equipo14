import { api } from './apiClient'

export async function getAllReports() {
  return api.get('/reports')
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
