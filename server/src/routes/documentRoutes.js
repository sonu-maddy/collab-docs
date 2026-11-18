const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');

const title = z.string().trim().min(1, 'Title cannot be empty').max(200, 'Title is too long');
const content = z.string().max(2_000_000, 'Document is too large');

const createSchema = z.object({ title: title.optional(), content: content.optional() });
const updateSchema = z
  .object({ title: title.optional(), content: content.optional() })
  .refine((v) => v.title !== undefined || v.content !== undefined, { message: 'Nothing to update' });
const shareSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),
  role: z.enum(['viewer', 'editor']),
});

module.exports = ({ documentService: svc }) => {
  const r = Router();
  r.use(requireAuth);

  r.get('/', async (req, res) => res.json({ documents: await svc.list(req.userId) }));
  r.post('/', validate(createSchema), async (req, res) => res.status(201).json({ document: await svc.create(req.userId, req.body) }));
  r.post('/import', upload.single('file'), async (req, res) =>
    res.status(201).json({ document: await svc.importFromFile(req.userId, req.file) })
  );
  r.get('/:id', async (req, res) => res.json({ document: await svc.get(req.userId, req.params.id) }));
  r.patch('/:id', validate(updateSchema), async (req, res) =>
    res.json({ document: await svc.update(req.userId, req.params.id, req.body) })
  );
  r.delete('/:id', async (req, res) => {
    await svc.remove(req.userId, req.params.id);
    res.status(204).end();
  });
  r.post('/:id/share', validate(shareSchema), async (req, res) =>
    res.json({ document: await svc.share(req.userId, req.params.id, req.body) })
  );
  r.delete('/:id/share/:userId', async (req, res) =>
    res.json({ document: await svc.unshare(req.userId, req.params.id, req.params.userId) })
  );
  return r;
};
