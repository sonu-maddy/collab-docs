/** In-memory implementations of the repository interfaces, used by tests. */
let seq = 0;
const nextId = () => String(++seq).padStart(24, '0');
const clone = (o) => (o ? JSON.parse(JSON.stringify(o)) : null);

function createMemoryRepos() {
  const users = new Map();
  const docs = new Map();

  const userRepo = {
    async create(u) {
      const user = { id: nextId(), ...u };
      users.set(user.id, user);
      return clone(user);
    },
    async findByEmail(email) { return clone([...users.values()].find((u) => u.email === email.toLowerCase())); },
    async findById(id) { return clone(users.get(id)); },
    async findByIds(ids) { return ids.map((i) => clone(users.get(i))).filter(Boolean); },
  };

  const docRepo = {
    async create({ title, content, ownerId, importedFrom = null }) {
      const now = new Date().toISOString();
      const doc = { id: nextId(), title, content, ownerId, collaborators: [], importedFrom, createdAt: now, updatedAt: now };
      docs.set(doc.id, doc);
      return clone(doc);
    },
    async findById(id) { return clone(docs.get(id)); },
    async listAccessibleTo(userId) {
      return [...docs.values()]
        .filter((d) => d.ownerId === userId || d.collaborators.some((c) => c.userId === userId))
        .map(clone);
    },
    async update(id, patch) {
      const d = docs.get(id);
      Object.assign(d, patch, { updatedAt: new Date().toISOString() });
      return clone(d);
    },
    async upsertCollaborator(id, userId, role) {
      const d = docs.get(id);
      const existing = d.collaborators.find((c) => c.userId === userId);
      if (existing) existing.role = role; else d.collaborators.push({ userId, role });
      return clone(d);
    },
    async removeCollaborator(id, userId) {
      const d = docs.get(id);
      d.collaborators = d.collaborators.filter((c) => c.userId !== userId);
      return clone(d);
    },
    async remove(id) { docs.delete(id); },
  };

  return { userRepo, docRepo };
}

module.exports = { createMemoryRepos };
