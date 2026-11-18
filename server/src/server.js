const env = require('./config/env');
const { connectDb } = require('./config/db');
const { createApp } = require('./app');
const userRepo = require('./repositories/userRepository');
const docRepo = require('./repositories/documentRepository');

(async () => {
  await connectDb(env.mongoUri);
  console.log('MongoDB connected');
  if (env.seedDemoData) {
    const { seedDemoData } = require('./seed');
    await seedDemoData();
    console.log('Demo data seeded (alice/bob/carol@example.com, password123)');
  }
  createApp({ userRepo, docRepo }).listen(env.port, () => console.log(`API listening on :${env.port}`));
})().catch((err) => {
  console.error('Failed to start', err);
  process.exit(1);
});
