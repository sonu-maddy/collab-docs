import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import RichTextEditor from '../components/RichTextEditor';
import SaveStatus from '../components/SaveStatus';
import ShareDialog from '../components/ShareDialog';
import RoleBadge from '../components/RoleBadge';
import { documentsApi } from '../api/documents';
import { useAutosave } from '../hooks/useAutosave';

export default function EditorPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    setDoc(null);
    setError('');
    documentsApi.get(id).then((d) => { setDoc(d); setTitle(d.title); }).catch((e) => setError(e.message));
  }, [id]);

  const save = useCallback((patch) => documentsApi.update(id, patch), [id]);
  const { status, error: saveError, schedule, flush } = useAutosave(save);

  if (error) {
    return (
      <>
        <Header />
        <main className="page"><p className="error">{error}</p><Link to="/">← Back to documents</Link></main>
      </>
    );
  }
  if (!doc) return <><Header /><p className="center-note">Loading…</p></>;

  const canEdit = doc.role !== 'viewer';
  const commitTitle = () => {
    const t = title.trim();
    if (!t) return setTitle(doc.title); // never save an empty title
    if (t !== doc.title) { setDoc((d) => ({ ...d, title: t })); schedule({ title: t }); }
  };

  return (
    <>
      <Header>
        <Link to="/" className="back">← All documents</Link>
      </Header>
      <main className="editor-page">
        <div className="editor-head">
          <input
            className="title-input"
            value={title}
            disabled={!canEdit}
            maxLength={200}
            aria-label="Document title"
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
          <div className="editor-meta">
            <RoleBadge role={doc.role} />
            {doc.role !== 'owner' && <span className="muted">Owner: {doc.owner.name}</span>}
            {canEdit && <SaveStatus status={status} error={saveError} onRetry={flush} />}
            {doc.role === 'owner' && <button className="btn primary" onClick={() => setSharing(true)}>Share</button>}
          </div>
        </div>
        <RichTextEditor key={doc.id} initialContent={doc.content} editable={canEdit} onChange={(content) => schedule({ content })} />
        {sharing && <ShareDialog doc={doc} onClose={() => setSharing(false)} onChange={(d) => setDoc((prev) => ({ ...prev, ...d, content: prev.content, title: prev.title }))} />}
      </main>
    </>
  );
}
