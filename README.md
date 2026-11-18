# Collab Docs

A lightweight collaborative document editor (Google-Docs-inspired) built with the **MERN** stack:
MongoDB · Express · React (Vite) · Node.

**Features:** rich-text editing (bold / italic / underline / H1–H3 / bulleted & numbered lists / quotes / links) with autosave ·
create / rename / reopen / delete documents · upload `.txt`, `.md`, `.docx` into a new editable document ·
share with another user as **editor** or **viewer** · "My documents" vs "Shared with me" views with role badges.

## Demo accounts (seeded)

| User | Email | Password | Role on the seeded doc |
|---|---|---|---|
| Alice | alice@example.com | password123 | owner |
| Bob | bob@example.com | password123 | editor |
| Carol | carol@example.com | password123 | viewer |

You can also sign up with any new email. Sharing works by the other person's **email** (they must have an account).

**Suggested review path:** log in as Alice → open the seeded doc → *Share* (change roles / remove) → log out →
log in as Bob (can edit) and Carol (read-only banner, disabled title/toolbar). Then upload a `.md` file from the home page.

## Run locally

Requirements: Node 20+ (22 recommended) and MongoDB (local, Atlas, or Docker).

### Option A – Docker (one command)
```bash
docker compose up --build        # http://localhost:5000  (demo users are seeded automatically)
```

### Option B – Node
```bash
# 1. MongoDB (skip if you already have one)
docker run -d -p 27017:27017 --name mongo mongo:7

# 2. API
cd server
cp .env.example .env             # set JWT_SECRET
npm install
npm run seed                     # demo users + shared doc (idempotent)
npm run dev                      # http://localhost:5000

# 3. Client (new terminal)
cd client
npm install
npm run dev                      # http://localhost:5173  (proxies /api -> :5000)
```

### Tests
```bash
cd server && npm test            # 31 tests: access rules, auth, CRUD, sanitising, sharing, uploads
cd client && npm test            # 5 tests: autosave hook, document list
```
Server tests run against an in-memory repository, so **no MongoDB is needed to run them**.

## Supported upload types
`.txt` (blank line = new paragraph), `.md` (Markdown → HTML), `.docx` (via mammoth: headings, bold/italic, lists; images and
complex layout are dropped). Max 5 MB. Anything else is rejected with a clear message (also shown in the UI).

## Deploy (free path)
1. Create a free **MongoDB Atlas** cluster, allow access from anywhere (0.0.0.0/0), copy the connection string.
2. Push this repo to GitHub → Render → **New → Blueprint** (uses `render.yaml` + `Dockerfile`).
3. Set `MONGO_URI`; `JWT_SECRET` is generated; `SEED_DEMO_DATA=true` creates the demo accounts on boot.
4. One service serves both the API and the built React app, so there is no CORS or cross-origin config.

Any Docker host works the same way (Fly.io, Railway, a VPS).

## Project layout
```
server/src
  config/        env + db connection
  models/        Mongoose schemas (User, Document)
  repositories/  the ONLY layer that touches Mongoose  <- swappable, test doubles live in tests/helpers
  services/      business rules (auth, documents, sharing, import)
  routes/        HTTP + zod validation, thin
  middleware/    auth, validation, upload, error mapping
  utils/         access rules (pure), HTML sanitiser, file importers
client/src
  api/           fetch wrapper + resource clients
  context/       AuthContext
  hooks/         useAutosave (debounced, serialised, retry-safe)
  components/    RichTextEditor (TipTap wrapper), Toolbar, ShareDialog, DocumentList, ...
  pages/         Login, Documents, Editor
```

## Status: what works / what's incomplete / next 2–4 hours
**Working end to end:** everything listed under *Features*; validation + error handling on every endpoint; sanitised HTML storage; 404-not-403 for inaccessible docs.

**Intentionally not built:** real-time co-editing (concurrent edits are last-write-wins), comments, version history, PDF export,
password reset / email invites (sharing requires the invitee to already have an account), pagination/search in the list.

**Next, in priority order:**
1. Conflict safety: add a `version` field and reject stale saves (409) with a "reload" prompt, then a "someone else edited" toast via polling.
2. Version history (snapshot on save at most every N minutes) + restore.
3. Markdown/PDF export.
4. Real-time via Yjs + TipTap collaboration extension + WebSocket provider (the editor is already isolated in one component).
5. Integration tests against a real MongoDB (`mongodb-memory-server` in CI) and a Playwright smoke test.
