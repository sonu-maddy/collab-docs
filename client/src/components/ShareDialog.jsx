import { useState } from 'react';
import Modal from './Modal';
import { documentsApi } from '../api/documents';

export default function ShareDialog({ doc, onClose, onChange }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const act = async (fn) => {
    setBusy(true);
    setError('');
    try {
      onChange(await fn());
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (await act(() => documentsApi.share(doc.id, { email, role }))) setEmail('');
  };

  return (
    <Modal title={`Share “${doc.title}”`} onClose={onClose}>
      <form className="share-form" onSubmit={submit}>
        <input type="email" required placeholder="Person's email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Permission">
          <option value="editor">Can edit</option>
          <option value="viewer">View only</option>
        </select>
        <button className="btn primary" disabled={busy}>Share</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}

      <h3 className="muted-h">People with access</h3>
      <ul className="people">
        <li><span><b>{doc.owner.name}</b> <small>{doc.owner.email}</small></span><span className="muted">Owner</span></li>
        {doc.collaborators.map((c) => (
          <li key={c.id}>
            <span><b>{c.name}</b> <small>{c.email}</small></span>
            <span className="people-actions">
              <select value={c.role} disabled={busy} aria-label={`Permission for ${c.name}`}
                onChange={(e) => act(() => documentsApi.share(doc.id, { email: c.email, role: e.target.value }))}>
                <option value="editor">Can edit</option>
                <option value="viewer">View only</option>
              </select>
              <button className="link-btn danger" disabled={busy} onClick={() => act(() => documentsApi.unshare(doc.id, c.id))}>Remove</button>
            </span>
          </li>
        ))}
        {doc.collaborators.length === 0 && <li className="muted">Not shared with anyone yet.</li>}
      </ul>
    </Modal>
  );
}
