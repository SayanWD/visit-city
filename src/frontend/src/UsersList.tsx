// src/frontend/src/UsersList.tsx
import { useEffect, useState } from 'react'
import { fetchUsers, deleteUser } from './api'
import type { User } from './api'
import { UsersForm } from './UsersForm'

export function UsersList() {
  const [users, setUsers]     = useState<User[]>([])
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<User | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await fetchUsers()
      setUsers(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleDelete = async (id: number) => {
    setLoading(true)
    try {
      await deleteUser(id)
      await loadUsers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    setEditing(null)
    loadUsers()
  }

  if (loading) return <div>Loading...</div>
  if (error)   return <div className="text-red-500">Error: {error}</div>

  return (
    <div className="space-y-4">
      {editing && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Edit user #{editing.id}</h2>
          <UsersForm
            user={editing}
            onCancel={() => setEditing(null)}
            onSuccess={handleSuccess}
          />
        </div>
      )}

      {users.length === 0 ? (
        <div>No users</div>
      ) : (
        <ul className="space-y-2">
          {users.map(u => (
            <li
              key={u.id}
              className="flex justify-between items-center p-2 border rounded"
            >
              <span>
                <strong>{u.name}</strong> ({u.email}) — <em>{u.role}</em>
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditing(u)}
                  className="px-2 py-1 border rounded hover:bg-yellow-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
                  className="px-2 py-1 border rounded hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
