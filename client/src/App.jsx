import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DocumentsPage from './pages/DocumentsPage';
// The editor (TipTap/ProseMirror) is the heaviest dependency: load it only when a doc is opened.
const EditorPage = lazy(() => import('./pages/EditorPage'));

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center-note">Loading…</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<Protected><DocumentsPage /></Protected>} />
      <Route path="/docs/:id" element={<Protected><Suspense fallback={<p className="center-note">Loading editor…</p>}><EditorPage /></Suspense></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
