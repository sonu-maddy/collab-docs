const mongoose = require('mongoose');
const Document = require('../models/Document');

const isId = (id) => mongoose.isValidObjectId(id);

const toEntity = (d) =>
  d && {
    id: String(d._id),
    title: d.title,
    content: d.content,
    ownerId: String(d.owner),
    collaborators: (d.collaborators || []).map((c) => ({ userId: String(c.user), role: c.role })),
    importedFrom: d.importedFrom,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };

/** Persistence boundary for documents (see userRepository for rationale). */
module.exports = {
  async create({ title, content, ownerId, importedFrom = null }) {
    const doc = await Document.create({ title, content, owner: ownerId, importedFrom });
    return toEntity(doc.toObject());
  },
  async findById(id) {
    if (!isId(id)) return null;
    return toEntity(await Document.findById(id).lean());
  },
  /** Documents the user owns or has been granted access to, newest first. */
  async listAccessibleTo(userId) {
    const docs = await Document.find({ $or: [{ owner: userId }, { 'collaborators.user': userId }] })
      .sort({ updatedAt: -1 })
      .lean();
    return docs.map(toEntity);
  },
  async update(id, patch) {
    return toEntity(await Document.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean());
  },
  /** Add the collaborator or change their role - idempotent. */
  async upsertCollaborator(id, userId, role) {
    const updated = await Document.findOneAndUpdate(
      { _id: id, 'collaborators.user': userId },
      { $set: { 'collaborators.$.role': role } },
      { new: true }
    ).lean();
    if (updated) return toEntity(updated);
    return toEntity(
      await Document.findByIdAndUpdate(id, { $push: { collaborators: { user: userId, role } } }, { new: true }).lean()
    );
  },
  async removeCollaborator(id, userId) {
    return toEntity(await Document.findByIdAndUpdate(id, { $pull: { collaborators: { user: userId } } }, { new: true }).lean());
  },
  async remove(id) {
    await Document.findByIdAndDelete(id);
  },
};
