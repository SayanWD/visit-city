import './App.css'
import { UsersList } from './UsersList'

export default function App() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <UsersList />
    </div>
  )
}