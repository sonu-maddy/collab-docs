# Submission contents

| Item | Location |
|---|---|
| Source code | `server/`, `client/` (+ `Dockerfile`, `docker-compose.yml`, `render.yaml`) |
| Local setup & run instructions, status, next steps | `README.md` |
| Architecture note | `ARCHITECTURE.md` |
| AI workflow note | `AI_WORKFLOW.md` |
| Walkthrough video URL | `VIDEO_URL.txt` |
| Live product URL | `LIVE_URL.txt` |
| Screenshots | `screenshots/` *(add: documents list, editor, share dialog, viewer read-only)* |

## Test credentials (also seeded on the live deployment)
`alice@example.com` (owner), `bob@example.com` (editor), `carol@example.com` (viewer) – password `password123`.

## Status
- **Working:** create / rename / edit (bold, italic, underline, H1–H3, bullet & numbered lists, quote, link) / autosave / reopen / delete; upload `.txt` `.md` `.docx` → new document; sharing with viewer/editor roles; owned vs shared views; auth; validation & error handling; 36 automated tests.
- **Incomplete / intentionally cut:** real-time co-editing (last-write-wins), comments, version history, export, email invites.
- **Next 2–4 hours:** stale-write detection (409) → version history → Markdown/PDF export → Yjs real-time.
