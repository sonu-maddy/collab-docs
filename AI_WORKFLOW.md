# AI Workflow Note

## Which AI tools I used
- **Claude (Anthropic) chat.** I gave it the assignment screenshots. It wrote the first version of the whole app: backend, frontend, tests, docs and Docker files. It also ran the tests in its own sandbox.
- [CONFIRM: add any other AI tool you used and what for. Delete this line if none.]

## Where AI saved me the most time
- Setting up the full project (routes, database models, React pages, CSS, Dockerfiles) in one go.
- Writing tests: 31 for the server and 5 for the client.
- Writing the first draft of the README and architecture note.
- Helping me read error messages from Docker and Render.

## What was wrong in the AI output and had to be fixed
I found these by running the code, not just by reading it.
1. **Test tool:** the first version used Jest. It crashed because two libraries (`sanitize-html` and `marked`) only support the newer module format. We switched to Vitest instead of using old library versions.
2. **Library versions:** some versions in `package.json` were guesses and did not match what was installed. We fixed them.
3. **Editor library:** TipTap already includes Underline and Link. The first version added them again. We removed the extra ones.
4. **Page size:** the first build made one big 677 kB file. The editor page now loads only when a document is opened.
5. **Docker files:** my local Dockerfiles were empty or missing, so the first build failed. I created them again with the right content.

## Problems I fixed myself
- **Port conflict:** port 3000 was used by my other project (`fintrack-frontend`). I found it with `docker ps` and moved this app to port 3001. I did not stop the other project.
- **Render deploy:** the first deploy failed because the Root Directory and Dockerfile path were wrong in Render. I fixed the settings and deployed again.
- [CONFIRM: add any other problem you fixed. Delete this line if none.]

## Decisions I made myself
- **Who can do what:** the owner can share and delete. An editor can edit and rename. A viewer can only read. If someone has no access, the server says "not found", so nobody can guess document ids.
- **What I did not build:** live co-editing, comments, version history and export. I wanted to do fewer things well.
- **How content is stored:** as cleaned HTML, so I did not need a custom format.
- **Deployment:** one service serves both the app and the API. MongoDB Atlas is the database. Reviewers need only one link.

## How I checked that it works
- **Automated tests:** `npm test` passes in both `server/` and `client/`.
- **Real database:** I ran the full app with Docker Compose (MongoDB, server and client as 3 containers) and tested it in the browser.
- **Manual test:** I logged in as Alice, made and formatted a document, refreshed to check it was saved, and uploaded a file. Then I shared it with Bob (editor) and Carol (viewer). Bob could edit. Carol could only read.
- [CONFIRM: I repeated the same sharing test on the live Render link. Delete this line if you did not.]
- **Security tests:** bad HTML (script tags, `onclick`, `javascript:` links) is removed. A stranger cannot open a document. A viewer cannot change it. An editor cannot share or delete it.

## Known limits
- If two people edit at the same time, the last save wins.
- The MongoDB code was checked by running the app, not by automatic tests. That is the first thing I would add next.