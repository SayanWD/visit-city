export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(\`\${BASE}/users\`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function createUser(name: string, email: string): Promise<User> {
  const res = await fetch(\`\${BASE}/users\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) throw new Error(\`Error: \${res.status}\`);
  return res.json();
}

export async function updateUser(
  id: number,
  data: Partial<Pick<User, 'name' | 'email'>>
): Promise<User> {
  const res = await fetch(\`\${BASE}/users/\${id}\`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(\`Error: \${res.status}\`);
  return res.json();
}

export async function deleteUser(id: number): Promise<void> {
  const res = await fetch(\`\${BASE}/users/\${id}\`, { method: 'DELETE' });
  if (res.status !== 204) throw new Error(\`Error: \${res.status}\`);
}
