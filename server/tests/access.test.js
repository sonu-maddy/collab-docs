const { getRole, can } = require('../src/utils/access');

const doc = { ownerId: 'u1', collaborators: [{ userId: 'u2', role: 'editor' }, { userId: 'u3', role: 'viewer' }] };

describe('access rules', () => {
  test('resolves roles', () => {
    expect(getRole(doc, 'u1')).toBe('owner');
    expect(getRole(doc, 'u2')).toBe('editor');
    expect(getRole(doc, 'u3')).toBe('viewer');
    expect(getRole(doc, 'stranger')).toBeNull();
    expect(getRole(null, 'u1')).toBeNull();
  });

  test.each([
    ['owner', 'read', true], ['owner', 'edit', true], ['owner', 'share', true], ['owner', 'delete', true],
    ['editor', 'read', true], ['editor', 'edit', true], ['editor', 'share', false], ['editor', 'delete', false],
    ['viewer', 'read', true], ['viewer', 'edit', false], ['viewer', 'share', false],
    [null, 'read', false], ['owner', 'unknown-action', false],
  ])('%s can %s -> %s', (role, action, expected) => {
    expect(can(role, action)).toBe(expected);
  });
});
