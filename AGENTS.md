# Abang Cebu project context

- Application code belongs in this project directory.
- Follow `docs/project-structure.md` for the current folder layout, ownership,
  and client/server boundaries. Next.js and the map preview now run; consult
  docs/development.md for commands and current implementation limits.
- The system's second brain is the Obsidian vault linked at `second-brain/`.
  Its actual path is `/home/hrmr/Documents/Obsidian Vault/Abang Cebu 2nd Brain`.
- Before planning or implementing a feature, read the relevant requirements,
  design notes, and decisions in the vault. Do not infer requirements from
  Obsidian's default welcome note.
- Treat the vault as project context; explicit user instructions take precedence.
- The owner paused work on 2026-09-07. The preview's colors, typography, wordmark,
  and logo/icon are provisional, not final design decisions. Read
  `second-brain/Session Log - 2026-09-07.md` when resuming; next discussion is
  color theory/palette, logo, and visual changes. Phone access remains unresolved.
- Confirmed: Next.js, React, TypeScript, Supabase; free technologies first;
  mobile-first PWA; map home; bottom-right agentic rental chatbot; finder,
  landlord, and admin experiences; human developers collaborating with AI.
- AWS EC2 is the confirmed production target. Bedrock access is available;
  provider order and paid inference budget remain proposed. Consult
  `second-brain/AI Providers and EC2 Deployment.md` before AI/hosting changes.
- Docker and Docker Compose are confirmed development/test/EC2 tooling. Follow
  `second-brain/Docker and Local Development.md`; Supabase CLI owns its local
  Docker stack while project Compose owns the app and test runners.
- Consult `second-brain/Map and Agent Experience.md`,
  `second-brain/Technology Stack.md`, `second-brain/Project Team.md`, and
  `second-brain/Delivery Plan.md`. Distinguish selected core requirements from
  proposed additions and defaults.
- Use project-specific team roles for independently scoped work. Give each task
  clear ownership, interfaces, acceptance criteria, and verification. Coordinate
  shared-file edits through the lead and independently review consequential
  authorization, geographic-query, agent-tool, and service-worker changes.
- Keep the vault in its current location and avoid duplicating its contents
  into the application repository.
- The symbolic link does not change filesystem permissions. Vault edits are
  writes to the external vault directory and must respect the active sandbox.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
