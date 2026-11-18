const { Schema, model } = require('mongoose');

const collaboratorSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['viewer', 'editor'], required: true },
  },
  { _id: false }
);

const documentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200, default: 'Untitled document' },
    // Sanitised HTML produced by the editor. Keeps formatting without a custom format.
    content: { type: String, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collaborators: { type: [collaboratorSchema], default: [] },
    // Present only when the doc was created by importing a file.
    importedFrom: { type: String, default: null },
  },
  { timestamps: true }
);

documentSchema.index({ 'collaborators.user': 1 });

module.exports = model('Document', documentSchema);
