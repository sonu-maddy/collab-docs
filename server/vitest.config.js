const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: { globals: true, environment: 'node', include: ['tests/**/*.test.js'], env: { NODE_ENV: 'test' } },
});
