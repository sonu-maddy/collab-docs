import { Link } from 'react-router-dom';
import RoleBadge from './RoleBadge';

const fmt = (iso) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

/** Presentational list: knows nothing about fetching. Same component renders "owned" and "shared". */
export default function DocumentList({ documents, emptyText, onDelete, showOwner = false }) {
  if (documents.length === 0) return <p className="empty">{emptyText}</p>;
  return (
    <ul className="doc-list">
      {documents.map((d) => (
        <li key={d.id} className="doc-card">
          <Link to={`/docs/${d.id}`} className="doc-link">
            <div className="doc-title">{d.title}</div>
            <div className="doc-snippet">{d.snippet || <em>Empty document</em>}</div>
            <div className="doc-meta">
              <RoleBadge role={d.role} />
              {showOwner && <span>Shared by {d.owner?.name}</span>}
              <span>Edited {fmt(d.updatedAt)}</span>
            </div>
          </Link>
          {onDelete && d.role === 'owner' && (
            <button className="icon-btn danger" aria-label={`Delete ${d.title}`} onClick={() => onDelete(d)}>🗑</button>
          )}
        </li>
      ))}
    </ul>
  );
}
