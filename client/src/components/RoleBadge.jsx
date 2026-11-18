const LABELS = { owner: 'Owner', editor: 'Can edit', viewer: 'View only' };

export default function RoleBadge({ role }) {
  return <span className={`badge badge-${role}`}>{LABELS[role] ?? role}</span>;
}
