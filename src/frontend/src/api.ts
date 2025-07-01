export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface ListingType {
  id: number;
  name: string;
  schema: any;
  created_at: string;
}

export interface Listing {
  id: number;
  owner_id: number;
  type_id: number;
  title: string;
  description?: string;
  location?: string;
  price?: number;
  gallery: string[];
  fields?: any;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// === Пользователи ===

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${BASE}/users`, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to fetch users (${res.status})`);
  return res.json();
}

export async function createUser(
  name: string,
  email: string
): Promise<User> {
  const res = await fetch(`${BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ name, email })
  });
  if (!res.ok) throw new Error(`Error creating user (${res.status})`);
  return res.json();
}

export async function updateUser(
  id: number,
  data: Partial<Pick<User, 'name' | 'email' | 'role'>>
): Promise<User> {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || `Error updating user (${res.status})`);
  }
  return res.json();
}

export async function deleteUser(id: number): Promise<void> {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: 'DELETE',
    headers: authHeader()
  });
  if (res.status !== 204) throw new Error(`Error deleting user (${res.status})`);
}

// === Listing Types ===

export async function fetchListingTypes(): Promise<ListingType[]> {
  const res = await fetch(`${BASE}/listing-types`, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to fetch listing types (${res.status})`);
  return res.json();
}

export async function fetchListingType(id: number): Promise<ListingType> {
  const res = await fetch(`${BASE}/listing-types/${id}`, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to fetch listing type (${res.status})`);
  return res.json();
}

export async function createListingType(
  name: string,
  schema: any
): Promise<ListingType> {
  const res = await fetch(`${BASE}/listing-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ name, schema })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || `Error creating listing type (${res.status})`);
  }
  return res.json();
}

export async function updateListingType(
  id: number,
  data: Partial<Pick<ListingType, 'name' | 'schema'>>
): Promise<ListingType> {
  const res = await fetch(`${BASE}/listing-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || `Error updating listing type (${res.status})`);
  }
  return res.json();
}

export async function deleteListingType(id: number): Promise<void> {
  const res = await fetch(`${BASE}/listing-types/${id}`, {
    method: 'DELETE',
    headers: authHeader()
  });
  if (res.status !== 204) throw new Error(`Error deleting listing type (${res.status})`);
}

// === Listings ===

export async function fetchListings(): Promise<Listing[]> {
  const res = await fetch(`${BASE}/listings`);
  if (!res.ok) throw new Error(`Failed to fetch listings (${res.status})`);
  return res.json();
}

export async function fetchListing(id: number): Promise<Listing> {
  const res = await fetch(`${BASE}/listings/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch listing (${res.status})`);
  return res.json();
}

export async function createListing(data: {
  type_id: number;
  title: string;
  description?: string;
  location?: string;
  price?: number;
  gallery?: string[];
  fields?: any;
}): Promise<Listing> {
  const res = await fetch(`${BASE}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || `Error creating listing (${res.status})`);
  }
  return res.json();
}

export async function updateListing(
  id: number,
  data: Partial<{
    type_id: number;
    title: string;
    description: string;
    location: string;
    price: number;
    gallery: string[];
    fields: any;
  }>
): Promise<Listing> {
  const res = await fetch(`${BASE}/listings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || `Error updating listing (${res.status})`);
  }
  return res.json();
}

export async function deleteListing(id: number): Promise<void> {
  const res = await fetch(`${BASE}/listings/${id}`, {
    method: 'DELETE',
    headers: authHeader()
  });
  if (res.status !== 204) throw new Error(`Error deleting listing (${res.status})`);
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
    body: JSON.stringify({ name, email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || `Signup failed (${res.status})`);
  }
  const { user, token } = await res.json();
  localStorage.setItem('token', token);
  return { user, token };
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string }> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || `Login failed (${res.status})`);
  }
  const { token } = await res.json();
  localStorage.setItem('token', token);
  return { token };
}

export async function fetchProfile(): Promise<User> {
  const res = await fetch(`${BASE}/profile`, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
  return res.json();
}

export function logout(): void {
  localStorage.removeItem('token');
}
