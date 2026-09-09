# Development setup

## What runs today

Update, 2026-09-08: the interactive sample-rental preview now includes a compact
location picker, local typing suggestions, and explicit Metro Cebu place/address
lookup through `/api/places` using Photon. Press Enter or the search icon to
look up places beyond the presets, then select a candidate. Online place search
needs internet but no API key. See [provider details](technology-decisions/place-search.md).
The visible radius chip supports fixed-center and map-view modes. Fixed searches
stay anchored when panning; map-view changes require “Search this area.” Radius
is straight-line distance (100 m–10 km), and rental results remain synthetic.
The chatbot launcher is circular and logo-only. Satellite imagery is not enabled.

Next.js 16.3.4, React 19.2.8, TypeScript, Tailwind CSS 4, and shadcn/Radix
Button/Dialog components form the app foundation. MapLibre GL JS displays the
OpenFreeMap Cebu map with attribution and loading/retry states. The chat launcher
opens an accessible preview dialog; it does not submit messages to a provider.
/api/health checks app liveness only. A custom 404 links back to the map.

Supabase browser/Route Handler clients use Zod-validated optional configuration.
No schema, RLS, authentication flows, session-refresh proxy, or data connection
is active yet. Bedrock/Groq AI SDK packages are installed; provider invocation,
fallback, budgets, and database tools must be implemented before exposing chat.
No private keys are needed to start this preview.

## Preview on a phone

For native development, connect the phone and computer to the same Wi-Fi.
Add the computer's current LAN IP to DEV_ALLOWED_ORIGINS in .env.local (host
only, no protocol or port), then run npm run dev. Open http://LAN_IP:3000 on
the phone. The dev server listens on all interfaces; update this setting if
the computer's IP changes. The default Docker port binding remains loopback.

## Native development

1. Install/use Node 22.23.1 with npm 10.9.8. If using nvm, run nvm use.
2. Run npm ci from the repository root.
3. Run npm run dev and visit http://localhost:3000.

predev and prebuild copy MapLibre's worker and shared module from the pinned
package into public/maplibre. This generated directory is ignored by Git.
The copy includes the upstream license. Both files are necessary for MapLibre 6
with Turbopack; do not remove this step when upgrading the map library.

Map tiles require internet and WebGL support. The list/preview and chat dialog
remain accessible when the map fails. Fonts are served locally from npm assets;
building does not download fonts from Google.

When implementing Supabase, copy .env.example to .env.local and fill the shared
development project's public URL and publishable key. Never put privileged keys
in NEXT_PUBLIC variables. Production public variables are build-time values;
rebuild the client when changing its Supabase project.

The server client helper currently supports Route Handlers and Server Actions
where cookies can be written. Add the documented refresh proxy and identity/
role checks before authenticated Server Component pages. Clients alone are
not an authentication implementation.

## Build and checks

```bash
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
npm start
```

The build copies public assets and .next/static into the standalone output.
npm start runs that output, matching Docker's Node server behavior.
Playwright starts an isolated production server at port 3100 and runs desktop
and mobile Chromium scenarios: failed map service, retained preview, chat dialog,
Escape/focus restoration, horizontal overflow, worker asset delivery, health,
and 404. Live map smoke checks are separate from deterministic CI tests.

ESLint is pinned to 9.39.5 because the React plugin bundled with the selected
Next.js config fails under ESLint 10. Re-evaluate this compatibility pin when
upgrading Next.js lint dependencies. ESLint 9 emits a deprecation notice.
Do not force incompatible peer versions or hide lint failures.

## Docker

```bash
docker compose config --quiet
docker compose up --build
docker compose down
```

Development mounts src and public for hot reload and reads optional .env.local.
Rebuild after package, root configuration, or script changes. App dependencies
stay in the image. The current setup does not start local Supabase.

The pinned official Node image uses AWS's public ECR mirror because Docker Hub
metadata requests timed out during setup. Dockerfile's NODE_IMAGE build argument
can select another trusted mirror of the same version.

For a local production preview, stop development on port 3000, then:

```bash
docker compose -f compose.production.yaml up --build -d app
docker compose -f compose.production.yaml down
```

This is a separate Compose file, not an override to combine with development.
The app runs as non-root with health checks and bounded logs. No source or
secret files are baked into the production image. Production server secrets
must be injected through the eventual deployment secret configuration.

The optional https profile starts Caddy. On EC2, set APP_DOMAIN to the real DNS
name and configure inbound 80/443 and HTTPS prerequisites before enabling it:

```bash
docker compose -f compose.production.yaml --profile https up -d
```

Keep app port 3000 private; the supplied host binding is loopback. Preserve
Caddy certificate volumes. Public HTTPS, EC2 IAM/model access, real Supabase
connectivity, backups/restore, and deployment rollback are launch checks and
are not proven by a successful local image build.

## Work remaining

Foundation verification on 2026-09-07: lint and type checks passed; the standalone
production build passed; all four Playwright desktop/mobile checks passed.
Live maps were inspected in the browser after fixing worker asset delivery.
Development and production Docker images built and served the app; the
production container was healthy, ran as UID 1000, and excluded vault/local
environment files. Both Compose files validate. Public Caddy TLS and AWS
deployment remain unverified.

Connect hosted development Supabase and implement reviewed schema/RLS/PostGIS;
then connect manual rental search and real cards/pins. Implement authentication
and role dashboards, the bounded agent/fallback budget policy, and the actual
PWA manifest/offline/update flow. Add TanStack Query/React Hook Form as their
data/form features appear, and k6 when real API/database workloads exist.
