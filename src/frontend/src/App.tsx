import { useState, useEffect } from 'react';
import { UsersList } from './UsersList';
import { SignupForm } from './SignupForm';
import { LoginForm } from './LoginForm';
import { logout, fetchProfile } from './api';

export default function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile()
        .then(() => setIsAuthed(true))
        .catch(() => {
          logout();
          setIsAuthed(false);
        });
    }
  }, []);

  if (!isAuthed) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-4">
        <div className="flex justify-center space-x-4">
          <button onClick={() => setMode('login')} className={mode === 'login' ? 'font-bold' : ''}>
            Log In
          </button>
          <button onClick={() => setMode('signup')} className={mode === 'signup' ? 'font-bold' : ''}>
            Sign Up
          </button>
        </div>
        {mode === 'login' ? (
          <LoginForm onSuccess={() => setIsAuthed(true)} />
        ) : (
          <SignupForm onSuccess={() => setIsAuthed(true)} />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => {
            logout();
            setIsAuthed(false);
          }}
          className="px-3 py-1 border rounded"
        >
          Logout
        </button>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-2">Create New User</h2>
        <SignupForm
          onSuccess={() => {
            setReloadKey((k) => k + 1);
          }}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Existing Users</h2>
        <UsersList key={reloadKey} />
      </section>
    </div>
  );
}
