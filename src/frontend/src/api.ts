// src/frontend/src/api.ts

export interface User {
  id: number
  name: string
  email: string
  created_at: string
}

export interface AuthResponse {
  user: User
  token: string
}

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// === Пользователи ===

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${BASE}/users`, {
    headers: authHeader(),
  })
  if (!res.ok) throw new Error(`Failed to fetch users (${res.status})`)
  return res.json()
}

export async function createUser(name: string, email: string): Promise<User> {
  const res = await fetch(`${BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ name, email }),
  })
  if (!res.ok) throw new Error(`Error: ${res.status}`)
  return res.json()
}

export async function updateUser(
  id: number,
  data: Partial<Pick<User, 'name' | 'email'>>
): Promise<User> {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Error: ${res.status}`)
  return res.json()
}

export async function deleteUser(id: number): Promise<void> {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  if (res.status !== 204) throw new Error(`Error: ${res.status}`)
}

// === Аутентификация ===

export async function signup(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error || `Signup failed (${res.status})`)
  }
  return res.json()
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string }> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error || `Login failed (${res.status})`)
  }
  return res.json()
}

export async function fetchProfile(): Promise<User> {
  const res = await fetch(`${BASE}/profile`, {
    headers: authHeader(),
  })
  if (!res.ok) throw new Error(`Failed to load profile (${res.status})`)
  return res.json()
}

// === Вспомогательное ===

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}
