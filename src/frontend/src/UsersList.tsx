import { useEffect, useState } from 'react';
import { fetchUsers, deleteUser, User } from './api';

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: number) => {
    try {
      await deleteUser(id);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (users.length === 0) return <div>No users</div>;

  return (
    <ul className="space-y-2">
      {users.map((u) => (
        <li key={u.id} className="flex justify-between items-center p-2 border rounded">
          <span>
            <strong>{u.name}</strong> ({u.email})
          </span>
          <button
            onClick={() => onDelete(u.id)}
            className="px-2 py-1 border rounded hover:bg-red-100"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
