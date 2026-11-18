/* Demo accounts + a shared doc so reviewers can test sharing immediately. Idempotent. */
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Document = require('./models/Document');

const PASSWORD = 'password123';
const USERS = [
  { name: 'Alice Owner', email: 'alice@example.com' },
  { name: 'Bob Editor', email: 'bob@example.com' },
  { name: 'Carol Viewer', email: 'carol@example.com' },
];
const DEMO_TITLE = 'Welcome to Collab Docs (shared demo)';

async function seedDemoData() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const users = {};
  for (const u of USERS) {
    users[u.email] = await User.findOneAndUpdate({ email: u.email }, { ...u, passwordHash }, { upsert: true, new: true });
  }
  if (!(await Document.exists({ title: DEMO_TITLE }))) {
    await Document.create({
      title: DEMO_TITLE,
      owner: users['alice@example.com']._id,
      content:
        '<h1>Welcome</h1><p>This document is owned by <strong>Alice</strong> and shared with Bob (editor) and Carol (viewer).</p>' +
        '<ul><li>Log in as Bob and edit this text.</li><li>Log in as Carol: the editor is read-only.</li></ul>',
      collaborators: [
        { user: users['bob@example.com']._id, role: 'editor' },
        { user: users['carol@example.com']._id, role: 'viewer' },
      ],
    });
  }
  return { emails: USERS.map((u) => u.email), password: PASSWORD };
}

module.exports = { seedDemoData };

// CLI: `npm run seed`
if (require.main === module) {
  const mongoose = require('mongoose');
  const env = require('./config/env');
  const { connectDb } = require('./config/db');
  (async () => {
    await connectDb(env.mongoUri);
    const { emails, password } = await seedDemoData();
    console.log(`Seeded. Accounts: ${emails.join(', ')} / password: ${password}`);
    await mongoose.disconnect();
  })().catch((e) => { console.error(e); process.exit(1); });
}
