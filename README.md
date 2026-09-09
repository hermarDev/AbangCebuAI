# Abang Cebu (AbangCebu AI)

> Mobile-first cartographic rental finder and AI companion platform for Metro Cebu, Philippines.

Abang Cebu is an open-source, mobile-first Web & PWA platform designed to help students, young professionals, and renters discover rooms, boarding houses, bedspaces, and apartments across Metro Cebu with transparent pricing, strict filter logic, and map-anchored exploration.

---

## Current Capabilities & Features

* **Cartographic Map Surface:** Powered by MapLibre GL JS and OpenFreeMap vector tiles with zero required API keys for baseline street mapping.
* **Interactive Radius Search:**
  * Fixed-anchor mode: Keeps the search circle anchored to a specific neighborhood or landmark while panning.
  * Map-view mode: Previews a dashed circle dynamically matching viewport zoom; explicit *"Search this area"* action commits the new scope.
  * Straight-line distance calculation (100 m to 10 km) via spherical Haversine geodesic algorithms.
* **Metro Cebu Place Lookup:** Live place and address lookup through `/api/places` using the Photon API, bounded to Metro Cebu with keyboard navigation and local preset suggestions.
* **Real-World Rental Filters:**
  * Budget range slider (₱0 to ₱10,000+/mo).
  * Room & property types (`bedspace`, `boarding_house`, `private_room`, `shared_room`, `studio`, `apartment`, `condo`).
  * Daily living policies (cooking allowed, laundry area, curfew types).
  * Utilities & amenities (Wi-Fi, air conditioning, water/power inclusion, motorcycle/car parking).
  * Trust & safety filters (direct landlord, verified properties).
  * Dynamic real-time match counter on the filter action button.
* **Bi-directional Map & Card Synchronization:**
  * Hovering or selecting a listing card highlights and elevates the corresponding map pin.
  * Clicking or hovering a map pin smoothly scrolls the listing card into view.
  * Clustered and co-located pin chooser for multi-unit buildings.
* **Google Maps-Style Mobile Ergonomics:**
  * Floating search capsule with horizontal quick-filter chips.
  * Smooth mobile results bottom sheet (docked peek state and expandable sheet) with safe-area protection.
  * Full-featured navigation drawer with account options, explore links, and landlord portal entry.
* **AI Companion Launcher:** Floating circular "Ask AbangCebu" FAB with accessible preview dialog, ready for AI SDK integration (Bedrock / Groq).
* **Database & PostGIS Architecture:**
  * Versioned SQL migrations for PostgreSQL + PostGIS spatial indexing (`ST_DWithin`, `ST_Distance`).
  * Server search procedure (`search_rentals` RPC) with strict "Unknown is not false" filter logic.
  * Graceful offline fallback to curated synthetic Cebu listings when offline or during testing.
* **Containerized Tooling:**
  * Docker & Docker Compose configurations for reproducible development and production previews.
  * Production Compose setup with Caddy HTTPS reverse proxy and standalone Node output.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Framework** | Next.js 16 (App Router), React 19, Strict TypeScript |
| **Styling & UI** | Tailwind CSS 4, shadcn / Radix UI primitives, Lucide icons, Manrope font |
| **Mapping & GIS** | MapLibre GL JS, OpenFreeMap, Photon geocoding, PostGIS |
| **Backend & DB** | Supabase (@supabase/ssr), PostgreSQL, PostGIS spatial queries |
| **AI Integration** | Vercel AI SDK (@ai-sdk/amazon-bedrock, @ai-sdk/groq) |
| **DevOps & Containers** | Docker Engine, Docker Compose, Caddy (TLS proxy), AWS EC2 target |
| **Quality & Testing** | Playwright (80 E2E tests across desktop & mobile Chromium), ESLint 9 |

---

## Quickstart & Local Development

### Prerequisites

* Node.js 22.23.1 (configured in `.nvmrc`)
* npm 10.9.8+
* Docker & Docker Compose (optional, for containerized run)

### Native Setup

```bash
# 1. Clone the repository
git clone https://github.com/hermarDev/AbangCebuAI.git
cd AbangCebuAI

# 2. Use the pinned Node version
nvm use

# 3. Install clean dependencies
npm ci

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. No external API keys or credentials are required for the initial map preview and synthetic search.

### Docker Development

```bash
# Start development container with hot reload
docker compose up --build

# Stop development container
docker compose down
```

### Production Preview (Standalone Node + Caddy)

```bash
# Build and run standalone production container
docker compose -f compose.production.yaml up --build -d app

# Optional: run with Caddy HTTPS reverse proxy
docker compose -f compose.production.yaml --profile https up -d
```

### Docker Hub (Team Collaboration)

The production Docker image is published to Docker Hub at [`hermardev/abangcebuai`](https://hub.docker.com/r/hermardev/abangcebuai).

```bash
# 1. Build and push a tagged image (e.g. latest, v0.1.0)
npm run docker:push                  # builds & pushes hermardev/abangcebuai:latest
bash scripts/deploy/docker-push.sh v0.1.0 # builds & pushes hermardev/abangcebuai:v0.1.0

# 2. How your teammates pull and run the latest image directly:
docker pull hermardev/abangcebuai:latest
docker run -p 3000:3000 hermardev/abangcebuai:latest

# Or pull and run using production Compose:
docker compose -f compose.production.yaml pull app
docker compose -f compose.production.yaml up -d app
```

---

## Verification & Testing Suite

All pull requests and commits are verified against a strict quality gate:

```bash
# 1. Lint checks (ESLint 9)
npm run lint

# 2. Type checking (Strict TypeScript)
npm run typecheck

# 3. Production standalone build
npm run build

# 4. End-to-end tests (Playwright - 80 tests on Desktop & Mobile Chromium)
npx playwright install chromium
npm run test:e2e

# 5. Run standalone production server locally
npm start
```

---

## Project Structure

```text
AbangCebu/
├── docs/                      # Technical decisions, licensing, and architecture docs
│   ├── development.md         # Comprehensive developer and mobile testing guide
│   ├── project-structure.md   # Detailed layer ownership and folder conventions
│   └── technology-decisions/  # Design docs (place-search, foundation, etc.)
├── infra/                     # Caddyfile and Docker production infrastructure
├── public/                    # Static assets, branding icons, and MapLibre worker files
├── src/
│   ├── app/                   # Next.js App Router routes, layouts, and API endpoints
│   │   ├── (finder)/          # Main map search and rental discovery experience
│   │   ├── api/               # /api/health, /api/places, /api/rentals Route Handlers
│   │   └── admin/ & landlord/ # Admin and landlord workspace shells
│   ├── components/            # Reusable UI primitives (dialog, popover, button)
│   ├── contracts/             # Shared TypeScript schemas and data contracts
│   ├── features/              # Feature modules (map, search, chat, listings, auth)
│   ├── lib/                   # Supabase clients (SSR browser/server) and environment validation
│   ├── server/                # Server-only database queries and provider adapters
│   └── styles/                # CSS modules, finder stylesheet, and design tokens
├── supabase/                  # PostGIS migrations, seeds, and database tests
└── tests/                     # Playwright E2E tests (navigation, branding, filters, UX)
```

See [`docs/project-structure.md`](docs/project-structure.md) for full architectural guidelines.

---

## Project Knowledge Vault (Second Brain)

Planning notes, user journeys, team roles, and architectural decisions are maintained in an external Obsidian vault symlinked at `second-brain/`:

```text
/home/hrmr/Documents/Obsidian Vault/Abang Cebu 2nd Brain
```

The symlink is excluded from Git to separate project implementation from personal vault notes. To recreate the link if needed:

```bash
ln -s '/home/hrmr/Documents/Obsidian Vault/Abang Cebu 2nd Brain' second-brain
```

Key reference notes in the vault:
* `Project Overview.md` — Core product vision and target Cebu student/worker audience.
* `Delivery Plan.md` — 8-step execution roadmap from foundation to EC2 deployment.
* `Map UI and Nearby Search.md` — Detailed cartographic interface specifications.
* `AI Providers and EC2 Deployment.md` — Bedrock/Groq orchestration and cost controls.
* `Docker and Local Development.md` — Environment setup and team container ownership.

---

## License

This project is open-source under the MIT License. Upstream assets, fonts (Manrope), and mapping data (OpenStreetMap/OpenFreeMap) retain their respective open-source licenses documented in `docs/licenses/`.
