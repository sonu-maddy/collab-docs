import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header({ children }) {
  const { user, logout } = useAuth();
  return (
    <header className="app-header">
      <Link to="/" className="brand">📄 Collab Docs</Link>
      <div className="header-mid">{children}</div>
      <div className="header-user">
        <span title={user.email}>{user.name}</span>
        <button className="btn" onClick={logout}>Log out</button>
      </div>
    </header>
  );
}
