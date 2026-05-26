import { api } from './apiClient'

export async function getUsers() {
  return api.get('/users')
}

export async function getUserById(id) {
  return api.get(`/users/${id}`)
}
