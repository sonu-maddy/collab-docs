# 📄 Collab Docs

A lightweight collaborative document editor inspired by Google Docs, built with the **MERN** stack
(MongoDB · Express · React · Node.js).

> **Live demo:** https://collab-docs-1-jr1v.onrender.com/
> *(Hosted on a free plan. If the page is slow to load the first time, wait about a minute while the server wakes up.)*

## Test accounts

All accounts use the password **`password123`**.

| User | Email | Role on the seeded demo document |
|---|---|---|
| Alice | `alice@example.com` | Owner |
| Bob | `bob@example.com` | Editor (can edit) |
| Carol | `carol@example.com` | Viewer (read-only) |

You can also sign up with any new email address.

### Quick review path (about 3 minutes)
1. Log in as **Alice**, open **"Welcome to Collab Docs (shared demo)"**, change some text, and refresh the page. Your changes are saved.
2. Click **Share** to add or remove people and change their permission.
3. Log out and log in as **Bob**. The document appears under **Shared with me** and is editable.
4. Log in as **Carol**. The document is read-only (banner shown, toolbar and title disabled).
5. On the home page click **Upload file** and choose a `.txt`, `.md` or `.docx` file. It becomes a new editable document.

---

## Features

| Area | What you can do |
|---|---|
| **Editing** | Bold, italic, underline, headings (H1–H3), bulleted and numbered lists, quotes, links, undo and redo |
| **Documents** | Create, rename, edit, reopen and delete (delete is owner-only) |
| **Autosave** | Changes save automatically; the status shows *Unsaved / Saving / Saved / Failed (Retry)*; warns before you close the tab with unsaved work |
| **File upload** | Import `.txt`, `.md` or `.docx` into a new editable document |
| **Sharing** | Share by email as **Can edit** or **View only**; change a role or remove access at any time |
| **Owned vs shared** | Separate "My documents" and "Shared with me" sections, with role badges |
| **Accounts** | Sign up, log in, JWT sessions, hashed passwords |
| **Safety** | Input validation, safe error messages, sanitised HTML (XSS protection), upload size and type limits |

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, **TipTap** (ProseMirror) rich-text editor |
| Backend | Node.js 22, Express 5, Mongoose, Zod (validation), Multer (uploads), JWT, bcrypt |
| Database | MongoDB (Atlas in production) |
| Parsing | `mammoth` (.docx), `marked` (.md), `sanitize-html` |
| Tests | Vitest, Supertest, React Testing Library |
| DevOps | Docker, Docker Compose, Render |

---

## Run locally

### Option A: Docker Compose (3 containers: MongoDB, server, client)

Requires Docker Desktop.

```bash
docker compose up -d --build
```

Open **http://localhost:3001**. Demo accounts are created automatically.

| Container | Role | Port |
|---|---|---|
| `mongo` | Database | internal |
| `server` | Express API | `5000` (health check: http://localhost:5000/api/health) |
| `client` | React app served by nginx, which also forwards `/api` to the server | `3001` |

Useful commands:
```bash
docker compose ps              # check status
docker compose logs server     # server logs
docker compose down            # stop (keeps data)
docker compose down -v         # stop and delete the database
```
If port `3001` or `5000` is already in use on your machine, change the left-hand number in `docker-compose.yml` (for example `"3002:80"`).

### Option B: Node.js (without Docker for the app)

Requires Node.js 20+ and a MongoDB instance (local, Atlas, or `docker run -d -p 27017:27017 mongo:7`).

```bash
# 1. API
cd server
cp .env.example .env        # then set JWT_SECRET (and MONGO_URI if needed)
npm install
npm run seed                # creates demo users + a shared document (safe to repeat)
npm run dev                 # http://localhost:5000

# 2. Client (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :5000)
```

### Tests

```bash
cd server && npm test       # 31 tests
cd client && npm test       # 5 tests
```
The server tests use an in-memory data store, so **no database is needed to run them**.

### Environment variables (`server/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/collab_docs` | MongoDB connection string |
| `JWT_SECRET` | dev-only value | Secret for signing tokens. **Required in production** |
| `PORT` | `5000` | API port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed browser origin (CORS) |
| `JWT_EXPIRES_IN` | `7d` | Session length |
| `MAX_UPLOAD_BYTES` | `5242880` | Upload limit (5 MB) |
| `SEED_DEMO_DATA` | `false` | Create demo users and document on startup |
| `CLIENT_DIST` | empty | Path to the built client; if set, Express serves the React app too |

---

## Supported upload types

| Type | How it is converted |
|---|---|
| `.txt` | A blank line starts a new paragraph |
| `.md` | Markdown converted to formatted text (headings, lists, bold, links) |
| `.docx` | Headings, bold, italic and lists are kept. Images and complex layouts are dropped |

Maximum file size is **5 MB**. Other file types are rejected with a clear message, and the supported types are also shown in the UI.

---

## API overview

All routes are under `/api` and return JSON. Everything except `/auth/*` and `/health` needs a `Authorization: Bearer <token>` header.

| Method | Route | Description |
|---|---|---|
| `POST` | `/auth/register`, `/auth/login` | Create an account / log in |
| `GET` | `/auth/me` | Current user |
| `GET` | `/documents` | Documents I own or that were shared with me |
| `POST` | `/documents` | Create a document |
| `POST` | `/documents/import` | Upload a file (`multipart`, field `file`) |
| `GET` · `PATCH` · `DELETE` | `/documents/:id` | Read / rename or edit / delete (owner only) |
| `POST` | `/documents/:id/share` | Share or change a role: `{ email, role }` (owner only) |
| `DELETE` | `/documents/:id/share/:userId` | Remove access (owner only) |

### Permissions

| Action | Owner | Editor | Viewer |
|---|:-:|:-:|:-:|
| Read | ✅ | ✅ | ✅ |
| Edit and rename | ✅ | ✅ | ❌ |
| Share / change roles | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ |

A user with no access gets **404** (not 403), so document IDs cannot be guessed.

---

## Deployment (free)

The app deploys as **one service**: Express serves both the API and the built React app. MongoDB Atlas is the database.

1. Create a free **MongoDB Atlas** cluster, add a database user, and allow access from anywhere (`0.0.0.0/0`).
2. Push this repository to GitHub.
3. On **Render**, create a **Web Service** from the repo with these settings:
   - Language: **Docker**, Dockerfile path: `./Dockerfile`, Root Directory: empty
   - Plan: **Free**, Health Check Path: `/api/health`
   - Environment variables: `MONGO_URI` (your Atlas string including `/collab_docs`), `JWT_SECRET` (any long random value), `SEED_DEMO_DATA=true`

The root `Dockerfile` builds the React app and runs the API, serving the built files. Any Docker host (Railway, Fly.io, a VPS) works the same way.

---

## Project structure

```
collab-docs/
├── server/
│   ├── src/
│   │   ├── config/         environment + database connection
│   │   ├── models/         Mongoose schemas (User, Document)
│   │   ├── repositories/   the only code that talks to MongoDB
│   │   ├── services/       business rules (auth, documents, sharing, import)
│   │   ├── routes/         HTTP routes + request validation
│   │   ├── middleware/     auth, validation, uploads, error handling
│   │   └── utils/          access rules, HTML sanitiser, file importers
│   ├── tests/              unit + API tests
│   └── Dockerfile
├── client/
│   ├── src/
│   │   ├── api/            fetch wrapper + API clients
│   │   ├── context/        auth state
│   │   ├── hooks/          useAutosave
│   │   ├── components/     editor, toolbar, share dialog, lists
│   │   └── pages/          Login, Documents, Editor
│   ├── nginx.conf
│   └── Dockerfile
├── Dockerfile              single-image build (used for Render)
├── docker-compose.yml      3-container local setup
├── ARCHITECTURE.md
└── AI_WORKFLOW.md
```

## Design highlights

- **Layered backend** (routes → services → repositories → models). Database code is isolated in two small files, so storage can be swapped and the whole API can be tested without a database.
- **Permissions in one place.** Access rules live in a single pure module and are enforced on every server operation, not just hidden in the UI.
- **Reliable autosave.** Saves are debounced, sent one at a time, kept for retry on failure, and flushed when you leave the page.
- **Safe content.** All incoming HTML (typed or uploaded) goes through an allow-list sanitiser.
- **Editor isolated** behind one component, so the editor library can be replaced without touching the rest of the app.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the reasoning and trade-offs, and [`AI_WORKFLOW.md`](AI_WORKFLOW.md) for how AI tools were used.

---

## Status

**Working end to end:** everything in the Features table, plus validation and error handling on every endpoint and 36 automated tests.

**Intentionally not built** (to keep the scope focused):
- Real-time co-editing (if two people save at the same time, the last save wins)
- Comments or suggestions, version history, PDF/Markdown export
- Email invitations for people without an account, password reset
- Search and pagination in the document list

**Next steps (with another 2–4 hours):**
1. Detect stale saves (add a version number, return 409, show a "reload" prompt).
2. Version history with restore.
3. Export to Markdown and PDF.
4. Real-time editing with Yjs and the TipTap collaboration extension.
5. Integration tests against a real MongoDB, and a Playwright browser test.