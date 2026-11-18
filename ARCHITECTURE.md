# Architecture note

## What I prioritised, and why
The brief asks for depth in a few areas over breadth. I put the effort where a reviewer can *see* it work and where mistakes are costly:

1. **A trustworthy sharing/permission model** – the only part that can leak data. Rules live in one pure module (`utils/access.js`: owner > editor > viewer; actions read/edit/share/delete) and are enforced in the *service* layer on every operation, never only in the UI. Inaccessible documents return **404** (not 403) so ids can't be probed; an under-privileged collaborator gets **403** with the reason.
2. **An editing experience that never loses work** – autosave is debounced, **serialised** (one request in flight; newer edits queue behind it), keeps the failed patch for retry, warns on tab close, and flushes on navigation. Status is always visible (Unsaved / Saving / Saved / Failed + Retry).
3. **Safe content handling** – the editor emits HTML; the server sanitises *all* inbound HTML (`sanitize-html` allow-list: only tags the editor can produce, http/https/mailto links, forced `rel=noopener`). Uploads are parsed in memory and sanitised through the same function.
4. **Maintainability** – see below.

## Key decisions
| Decision | Why | Trade-off |
|---|---|---|
| **TipTap (ProseMirror)** editor | Mature, headless, extensible; Yjs collaboration drops in later | Heavier bundle → lazy-loaded route |
| **Store sanitised HTML** in one field | Preserves formatting with zero custom format; trivial to import/export | Not diff-friendly; version history would store snapshots |
| **JWT in `localStorage`**, bcrypt passwords | Simple, stateless, fine for the scope | XSS-exposed; mitigated by sanitising all HTML. Production would use httpOnly cookies + CSRF protection |
| **Share by email, roles viewer/editor** | Clear, demonstrable, one step beyond the minimum | No pending invites for unregistered emails |
| **Last-write-wins** saves | Real-time/OT is out of scope for the timebox | Two simultaneous editors can overwrite each other (top of the "next" list) |
| **One deployable** (Express serves the built SPA) | Free single service, no CORS, one URL for reviewers | Client and API scale together |
| **File import → new document** | Product-relevant, no storage of binaries needed | Original file isn't kept; `.docx` fidelity is limited to mammoth's mapping |

## Layering (reusable & maintainable)
```
routes  →  services  →  repositories  →  Mongoose models
(HTTP,     (business    (the only place   (schemas)
 zod)       rules,       Mongo is touched)
            access)
```
- **Dependency injection**: `createApp({ userRepo, docRepo })`. Production passes the Mongoose repositories; tests pass in-memory ones, so the full HTTP stack is tested in milliseconds without a database. Swapping Mongo for another store means rewriting two files.
- **Services return plain DTOs**, never Mongoose documents → no ORM leakage into controllers/clients.
- **Strategy table for importers** (`utils/importers.js`): adding `.rtf`/`.html` is one new entry + a test.
- **Validation at the edge** with zod schemas next to the routes; one error type (`AppError`) mapped to JSON by one middleware.
- **Client**: one `http()` wrapper (auth header, uniform errors, 401 → logout), thin resource clients, presentational components (`DocumentList`, `RoleBadge`) reused for both "owned" and "shared" lists, and the editor library isolated behind `RichTextEditor`'s tiny interface (`initialContent`, `editable`, `onChange`).

## Data model
```
User     { name, email (unique, lowercase), passwordHash (select:false) }
Document { title, content (sanitised HTML), owner → User, collaborators: [{ user → User, role: viewer|editor }],
           importedFrom?, timestamps }      indexes: owner, collaborators.user
```

## API (all under `/api`, JSON, Bearer token except auth)
```
POST   /auth/register | /auth/login        GET /auth/me
GET    /documents                          list owned + shared (role, owner, snippet)
POST   /documents                          create
POST   /documents/import                   multipart "file" (.txt/.md/.docx) → new document
GET    /documents/:id    PATCH /documents/:id {title?, content?}    DELETE (owner)
POST   /documents/:id/share {email, role}  (owner; idempotent — also changes role)
DELETE /documents/:id/share/:userId        (owner)
```

## Testing strategy
- **Pure unit tests**: access matrix (every role × action), importers.
- **API tests** over the real Express app: auth, validation, lifecycle, XSS sanitising, every sharing path (stranger/viewer/editor/owner, revoke, role change), upload errors.
- **Client tests**: the autosave hook (debounce, no parallel saves, retry) – the most failure-prone UI logic – and the list component.
- **Known gap**: the Mongoose repositories themselves are exercised only by running the app (they're ~60 lines, isolated for that reason). First thing to add: CI integration tests with `mongodb-memory-server`.
