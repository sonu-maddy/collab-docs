/**
 * Pure access-control rules. No I/O, so it is trivially unit-testable.
 * Roles: owner > editor > viewer.
 */
const ACTIONS = {
  read: ['owner', 'editor', 'viewer'],
  edit: ['owner', 'editor'],
  share: ['owner'],
  delete: ['owner'],
};

function getRole(doc, userId) {
  if (!doc || !userId) return null;
  if (String(doc.ownerId) === String(userId)) return 'owner';
  const entry = (doc.collaborators || []).find((c) => String(c.userId) === String(userId));
  return entry ? entry.role : null;
}

function can(role, action) {
  return Boolean(role && ACTIONS[action] && ACTIONS[action].includes(role));
}

module.exports = { getRole, can, ACTIONS };
