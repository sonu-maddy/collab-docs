const AppError = require('../utils/AppError');
const { getRole, can } = require('../utils/access');
const { sanitize } = require('../utils/sanitize');
const { importFile } = require('../utils/importers');

const stripHtml = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const publicUser = (u) => (u ? { id: u.id, name: u.name, email: u.email } : null);

module.exports = function createDocumentService({ docRepo, userRepo }) {
  /** Loads a doc and enforces `action`. Unknown/inaccessible docs are 404 so ids can't be probed. */
  async function loadWithAccess(userId, docId, action) {
    const doc = await docRepo.findById(docId);
    const role = getRole(doc, userId);
    if (!role) throw AppError.notFound('Document not found');
    if (!can(role, action)) throw AppError.forbidden(`Your role (${role}) cannot ${action} this document`);
    return { doc, role };
  }

  async function usersById(ids) {
    const users = await userRepo.findByIds([...new Set(ids)]);
    return new Map(users.map((u) => [u.id, u]));
  }

  async function toDetail(doc, role) {
    const users = await usersById([doc.ownerId, ...doc.collaborators.map((c) => c.userId)]);
    return {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      role,
      owner: publicUser(users.get(doc.ownerId)),
      // Only the owner manages sharing, so only the owner needs the collaborator list.
      collaborators:
        role === 'owner'
          ? doc.collaborators.map((c) => ({ ...publicUser(users.get(c.userId)), role: c.role }))
          : undefined,
      importedFrom: doc.importedFrom,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  return {
    async list(userId) {
      const docs = await docRepo.listAccessibleTo(userId);
      const users = await usersById(docs.map((d) => d.ownerId));
      return docs.map((d) => ({
        id: d.id,
        title: d.title,
        role: getRole(d, userId),
        owner: publicUser(users.get(d.ownerId)),
        snippet: stripHtml(d.content).slice(0, 140),
        updatedAt: d.updatedAt,
      }));
    },

    async create(userId, { title, content }) {
      const doc = await docRepo.create({
        title: title || 'Untitled document',
        content: sanitize(content),
        ownerId: userId,
      });
      return toDetail(doc, 'owner');
    },

    async get(userId, docId) {
      const { doc, role } = await loadWithAccess(userId, docId, 'read');
      return toDetail(doc, role);
    },

    async update(userId, docId, { title, content }) {
      const { role } = await loadWithAccess(userId, docId, 'edit');
      const patch = {};
      if (title !== undefined) patch.title = title;
      if (content !== undefined) patch.content = sanitize(content);
      const doc = await docRepo.update(docId, patch);
      return toDetail(doc, role);
    },

    async remove(userId, docId) {
      await loadWithAccess(userId, docId, 'delete');
      await docRepo.remove(docId);
    },

    async share(userId, docId, { email, role }) {
      const { doc } = await loadWithAccess(userId, docId, 'share');
      const target = await userRepo.findByEmail(email);
      if (!target) throw AppError.notFound('No user with that email. Ask them to sign up first.');
      if (target.id === doc.ownerId) throw AppError.badRequest('You already own this document');
      const updated = await docRepo.upsertCollaborator(docId, target.id, role);
      return toDetail(updated, 'owner');
    },

    async unshare(userId, docId, targetUserId) {
      await loadWithAccess(userId, docId, 'share');
      const updated = await docRepo.removeCollaborator(docId, targetUserId);
      return toDetail(updated, 'owner');
    },

    async importFromFile(userId, file) {
      if (!file) throw AppError.badRequest('No file uploaded (field name: "file")');
      const { title, content } = await importFile(file);
      const doc = await docRepo.create({ title, content, ownerId: userId, importedFrom: file.originalname });
      return toDetail(doc, 'owner');
    },
  };
};
