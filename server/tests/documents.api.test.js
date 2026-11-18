const request = require('supertest');
const { createApp } = require('../src/app');
const { createMemoryRepos } = require('./helpers/memoryRepos');

let api;
const signup = async (name) => {
  const res = await api.post('/api/auth/register').send({ name, email: `${name.toLowerCase()}@test.com`, password: 'password123' });
  expect(res.status).toBe(201);
  return { token: res.body.token, id: res.body.user.id, email: res.body.user.email };
};
const as = (u) => ({ Authorization: `Bearer ${u.token}` });

beforeEach(() => {
  api = request(createApp(createMemoryRepos()));
});

describe('auth', () => {
  test('register, login, and reject bad credentials', async () => {
    await signup('Alice');
    const ok = await api.post('/api/auth/login').send({ email: 'alice@test.com', password: 'password123' });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();
    expect(ok.body.user.passwordHash).toBeUndefined();

    const bad = await api.post('/api/auth/login').send({ email: 'alice@test.com', password: 'wrong-password' });
    expect(bad.status).toBe(401);
  });

  test('validates input and blocks duplicate emails', async () => {
    const weak = await api.post('/api/auth/register').send({ name: 'X', email: 'nope', password: 'short' });
    expect(weak.status).toBe(400);
    await signup('Alice');
    const dup = await api.post('/api/auth/register').send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });
    expect(dup.status).toBe(409);
  });

  test('documents require authentication', async () => {
    expect((await api.get('/api/documents')).status).toBe(401);
  });
});

describe('document lifecycle', () => {
  test('create, rename, edit, reopen, delete', async () => {
    const alice = await signup('Alice');
    const created = await api.post('/api/documents').set(as(alice)).send({});
    expect(created.body.document.title).toBe('Untitled document');
    const id = created.body.document.id;

    const patched = await api.patch(`/api/documents/${id}`).set(as(alice)).send({ title: 'Plan', content: '<p><strong>Hi</strong></p>' });
    expect(patched.status).toBe(200);

    const reopened = await api.get(`/api/documents/${id}`).set(as(alice));
    expect(reopened.body.document).toMatchObject({ title: 'Plan', content: '<p><strong>Hi</strong></p>', role: 'owner' });

    expect((await api.delete(`/api/documents/${id}`).set(as(alice))).status).toBe(204);
    expect((await api.get(`/api/documents/${id}`).set(as(alice))).status).toBe(404);
  });

  test('rejects empty titles and empty patches', async () => {
    const alice = await signup('Alice');
    const { body } = await api.post('/api/documents').set(as(alice)).send({});
    const id = body.document.id;
    expect((await api.patch(`/api/documents/${id}`).set(as(alice)).send({ title: '   ' })).status).toBe(400);
    expect((await api.patch(`/api/documents/${id}`).set(as(alice)).send({})).status).toBe(400);
  });

  test('sanitises stored HTML (XSS)', async () => {
    const alice = await signup('Alice');
    const { body } = await api
      .post('/api/documents').set(as(alice))
      .send({ content: '<p onclick="x()">ok</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a>' });
    expect(body.document.content).toContain('<p>ok</p>');
    expect(body.document.content).not.toMatch(/script|onclick|javascript:/);
  });
});

describe('sharing', () => {
  let alice, bob, carol, docId;
  beforeEach(async () => {
    [alice, bob, carol] = [await signup('Alice'), await signup('Bob'), await signup('Carol')];
    docId = (await api.post('/api/documents').set(as(alice)).send({ title: 'Secret', content: '<p>v1</p>' })).body.document.id;
  });

  test('a stranger cannot see or list the document (404, no leak)', async () => {
    expect((await api.get(`/api/documents/${docId}`).set(as(bob))).status).toBe(404);
    expect((await api.get('/api/documents').set(as(bob))).body.documents).toHaveLength(0);
  });

  test('owner shares as editor: shows as shared, can edit, cannot share or delete', async () => {
    const shared = await api.post(`/api/documents/${docId}/share`).set(as(alice)).send({ email: bob.email, role: 'editor' });
    expect(shared.status).toBe(200);
    expect(shared.body.document.collaborators).toHaveLength(1);

    const list = (await api.get('/api/documents').set(as(bob))).body.documents;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ role: 'editor', owner: { email: alice.email } });

    expect((await api.patch(`/api/documents/${docId}`).set(as(bob)).send({ content: '<p>v2</p>' })).status).toBe(200);
    expect((await api.post(`/api/documents/${docId}/share`).set(as(bob)).send({ email: carol.email, role: 'viewer' })).status).toBe(403);
    expect((await api.delete(`/api/documents/${docId}`).set(as(bob))).status).toBe(403);
  });

  test('viewer can read but not edit; changing role is idempotent', async () => {
    await api.post(`/api/documents/${docId}/share`).set(as(alice)).send({ email: carol.email, role: 'viewer' });
    expect((await api.get(`/api/documents/${docId}`).set(as(carol))).status).toBe(200);
    expect((await api.patch(`/api/documents/${docId}`).set(as(carol)).send({ title: 'Hacked' })).status).toBe(403);

    const upgraded = await api.post(`/api/documents/${docId}/share`).set(as(alice)).send({ email: carol.email, role: 'editor' });
    expect(upgraded.body.document.collaborators).toEqual([expect.objectContaining({ email: carol.email, role: 'editor' })]);
  });

  test('revoking access removes the document for that user', async () => {
    await api.post(`/api/documents/${docId}/share`).set(as(alice)).send({ email: bob.email, role: 'viewer' });
    await api.delete(`/api/documents/${docId}/share/${bob.id}`).set(as(alice));
    expect((await api.get(`/api/documents/${docId}`).set(as(bob))).status).toBe(404);
  });

  test('share validation: unknown user, self, bad role', async () => {
    const send = (body) => api.post(`/api/documents/${docId}/share`).set(as(alice)).send(body);
    expect((await send({ email: 'ghost@test.com', role: 'viewer' })).status).toBe(404);
    expect((await send({ email: alice.email, role: 'viewer' })).status).toBe(400);
    expect((await send({ email: bob.email, role: 'admin' })).status).toBe(400);
  });
});

describe('file upload', () => {
  test('imports a .txt into a new editable document', async () => {
    const alice = await signup('Alice');
    const res = await api.post('/api/documents/import').set(as(alice)).attach('file', Buffer.from('Line one\n\nLine two'), 'meeting.txt');
    expect(res.status).toBe(201);
    expect(res.body.document).toMatchObject({ title: 'meeting', content: '<p>Line one</p><p>Line two</p>', importedFrom: 'meeting.txt' });
  });

  test('rejects unsupported types and missing files', async () => {
    const alice = await signup('Alice');
    const bad = await api.post('/api/documents/import').set(as(alice)).attach('file', Buffer.from('MZ'), 'virus.exe');
    expect(bad.status).toBe(400);
    expect(bad.body.error).toMatch(/Supported/);
    expect((await api.post('/api/documents/import').set(as(alice))).status).toBe(400);
  });
});
