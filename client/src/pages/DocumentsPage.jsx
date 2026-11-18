import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import DocumentList from '../components/DocumentList';
import { documentsApi, SUPPORTED_UPLOADS } from '../api/documents';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => documentsApi.list().then(setDocs).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const { owned, shared } = useMemo(() => ({
    owned: (docs ?? []).filter((d) => d.role === 'owner'),
    shared: (docs ?? []).filter((d) => d.role !== 'owner'),
  }), [docs]);

  const guard = async (fn) => {
    setBusy(true);
    setError('');
    try { return await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const create = () => guard(async () => navigate(`/docs/${(await documentsApi.create()).id}`));

  const upload = (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file
    if (file) guard(async () => navigate(`/docs/${(await documentsApi.importFile(file)).id}`));
  };

  const remove = (d) => {
    if (!window.confirm(`Delete “${d.title}”? This cannot be undone.`)) return;
    guard(async () => { await documentsApi.remove(d.id); await load(); });
  };

  return (
    <>
      <Header />
      <main className="page">
        <div className="page-actions">
          <button className="btn primary" onClick={create} disabled={busy}>+ New document</button>
          <button className="btn" onClick={() => fileInput.current.click()} disabled={busy}>⬆ Upload file</button>
          <span className="muted">Supported: {SUPPORTED_UPLOADS.join(', ')} (max 5 MB)</span>
          <input ref={fileInput} type="file" accept={SUPPORTED_UPLOADS.join(',')} onChange={upload} hidden data-testid="file-input" />
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        {docs === null && !error ? <p className="muted">Loading documents…</p> : (
          <>
            <h2 className="section-title">My documents <span className="count">{owned.length}</span></h2>
            <DocumentList documents={owned} onDelete={remove} emptyText="You haven't created any documents yet." />
            <h2 className="section-title">Shared with me <span className="count">{shared.length}</span></h2>
            <DocumentList documents={shared} showOwner emptyText="Nothing has been shared with you yet." />
          </>
        )}
      </main>
    </>
  );
}
