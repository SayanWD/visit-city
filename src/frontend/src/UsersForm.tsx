import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { createUser, updateUser } from './api'
import type { User } from './api'

export interface UsersFormProps {
  /** При передаче — режим редактирования */
  user?: User
  /** Вызывается после успешного сабмита */
  onSubmit: (data: { name: string; email: string }) => void
  /** Опционально: кнопка «Отмена» */
  onCancel?: () => void
}

export function UsersForm({ user, onSubmit, onCancel }: UsersFormProps) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // при смене user сбрасываем поля
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
    setError(null)
  }, [user])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required')
      return
    }
    setLoading(true)
    try {
      if (user) {
        await updateUser(user.id, { name, email })
      } else {
        await createUser(name, email)
      }
      onSubmit({ name, email })
      // после создания сбрасываем поля
      if (!user) {
        setName('')
        setEmail('')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 p-4 border rounded mb-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          className="mt-1 block w-full border px-2 py-1"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          className="mt-1 block w-full border px-2 py-1"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {user ? 'Update' : 'Add'} User
        </button>
        {user && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
