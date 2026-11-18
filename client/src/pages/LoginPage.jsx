import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DEMO = [
  { label: 'Alice (owner)', email: 'alice@example.com' },
  { label: 'Bob (editor)', email: 'bob@example.com' },
  { label: 'Carol (viewer)', email: 'carol@example.com' },
];

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await (mode === 'login' ? login({ email: form.email, password: form.password }) : register(form));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>📄 Collab Docs</h1>
        <p className="muted">{mode === 'login' ? 'Log in to your documents' : 'Create an account'}</p>
        {mode === 'register' && <input placeholder="Name" value={form.name} onChange={set('name')} required aria-label="Name" />}
        <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required aria-label="Email" />
        <input type="password" placeholder="Password (min 8 characters)" value={form.password} onChange={set('password')} required minLength={mode === 'register' ? 8 : 1} aria-label="Password" />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary wide" disabled={busy}>{mode === 'login' ? 'Log in' : 'Sign up'}</button>
        <button type="button" className="link-btn" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
        </button>
        {mode === 'login' && (
          <div className="demo-box">
            <p className="muted">Demo accounts (password <code>password123</code>) – click to fill:</p>
            {DEMO.map((d) => (
              <button type="button" key={d.email} className="chip" onClick={() => setForm((f) => ({ ...f, email: d.email, password: 'password123' }))}>
                {d.label}
              </button>
            ))}
          </div>
        )}
      </form>
    </main>
  );
}
