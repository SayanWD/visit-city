// src/frontend/src/UsersList.tsx
import { useEffect, useState } from 'react'
import { fetchUsers, deleteUser } from './api'
import type { User } from './api'
import { UsersForm } from './UsersForm'

export function UsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<User | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchUsers()
      setUsers(data)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onDelete = async (id: number) => {
    try {
      await deleteUser(id)
      load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleSubmit = () => {
    // сброс режима редактирования и перезагрузка списка
    setEditing(null)
    load()
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">Error: {error}</div>

  return (
    <div className="space-y-4">
      {/* Форма создания */}
      {!editing && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Create user</h2>
          <UsersForm onSubmit={handleSubmit} />
        </div>
      )}

      {/* Форма редактирования */}
      {editing && (
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Edit user #{editing.id}
          </h2>
          <UsersForm
            user={editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {/* Список пользователей */}
      {users.length === 0 ? (
        <div>No users</div>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex justify-between items-center p-2 border rounded"
            >
              <span>
                <strong>{u.name}</strong> ({u.email})
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditing(u)}
                  className="px-2 py-1 border rounded hover:bg-yellow-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(u.id)}
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
