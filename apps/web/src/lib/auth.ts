import { api } from './api'

export interface User {
  id: string
  name: string
  email: string
  role: string
  plan: string
  organization?: string
  avatarUrl?: string
  emailVerified: boolean
}

export async function login(email: string, password: string) {
  const data = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
    '/api/auth/login',
    { email, password },
  )
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  return data.user
}

export async function logout() {
  const refreshToken = localStorage.getItem('refreshToken')
  if (refreshToken) {
    await api.post('/api/auth/logout', { refreshToken }).catch(() => {})
  }
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export async function getMe() {
  return api.get<User>('/api/auth/me')
}

export function isAuthenticated() {
  return typeof window !== 'undefined' && !!localStorage.getItem('accessToken')
}
