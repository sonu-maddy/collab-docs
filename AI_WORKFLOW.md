# AI workflow note

> ⚠️ **Candidate: edit this file before submitting.** It describes how this codebase was actually produced.
> Keep only statements that are true for you, and fill in the "My own review" section with what *you* verified and changed.

## Which AI tools were used
- **Claude (Anthropic), chat interface** – generated the first full implementation (server, client, tests, docs, Docker/deploy config) from a screenshot of the assignment brief, and ran the tests/build in a sandbox.
- *(add any other tools you used, e.g. Copilot / Cursor, and for what)*

## Where AI materially sped up the work
- Scaffolding the full MERN skeleton and the repetitive parts (routes, schemas, CSS, config, Dockerfile) in one pass.
- Writing the 31 server + 5 client tests, including the permission matrix and the autosave race conditions.
- Drafting README / architecture documentation.

## AI-generated output that had to be corrected during the build
These were caught by running the code, not by reading it:
1. **Test runner**: first draft used Jest; it crashed because current `sanitize-html` / `marked` ship ESM-only code that Jest (CommonJS) can't load. Switched to Vitest instead of pinning old, outdated dependency versions.
2. **Dependency versions** guessed in `package.json` didn't match what actually installed (dotenv, marked, mongoose); aligned to the installed versions.
3. **TipTap v3** already bundles Underline and Link in StarterKit; the first draft added them separately (duplicate-extension warning). Removed.
4. **Bundle size**: first build produced a 677 kB chunk; the editor route is now lazy-loaded (268 kB + 410 kB on demand).

## Decisions I made / would not delegate
- Permission semantics (404 vs 403, owner-only sharing/deleting, editors may rename + edit).
- Scope cuts: no real-time editing, versioning or export (see README "Intentionally not built").
- Storing sanitised HTML rather than a custom document format.

## How correctness, UX and reliability were verified
- **Automated**: `npm test` in `server/` and `client/` (all passing at submission).
- **Production-path smoke test**: Express serving the built SPA, SPA deep-link fallback, health route, 404 JSON for unknown API routes, real `.md` and hand-built `.docx` imports.
- **Security checks as tests**: XSS payloads (`<script>`, `onclick`, `javascript:` URLs) are stripped; strangers cannot read/list; viewers cannot write; editors cannot share/delete.
- **Not verified in the sandbox**: behaviour against a real MongoDB server and in a real browser (none available there). *Candidate: run through the flow in the README and note anything you changed.*

## My own review *(fill in)*
- What I read line-by-line / changed / rejected:
- What I tested manually in the browser and on the deployed URL:
