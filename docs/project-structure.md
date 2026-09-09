# Project structure

This is a single Next.js/React/TypeScript application with a server runtime on
EC2. Next.js and related foundation packages are installed. The map preview,
health endpoint, Docker files, and Playwright checks are implemented; see
[development setup](development.md). Database features and the agent remain pending.
Empty directories contain .gitkeep so Git can retain them when committed.
Git is initialized and main tracks the existing GitHub repository; the local
skeleton has not yet been committed or pushed.

Product requirements and architecture decisions remain in the external
[second brain](../second-brain/Project%20Overview.md). This guide describes the
code layout and contribution conventions, not a second copy of those notes.

## Directory map

```text
AbangCebu/
├── src/
│   ├── app/                  Next.js pages, layouts, and HTTP endpoints
│   │   ├── (finder)/         Map home, rental details, finder account
│   │   │   ├── rentals/[id]/
│   │   │   └── account/
│   │   ├── (auth)/sign-in/
│   │   ├── auth/callback/
│   │   ├── landlord/listings/
│   │   │   ├── new/
│   │   │   └── [id]/edit/
│   │   ├── admin/            Users, listings, landmark management
│   │   └── api/              Chat, rental search, health endpoints
│   ├── features/             map, search, chat, listings, auth,
│   │                        landlord, admin, pwa
│   ├── components/           Shared ui primitives and layout components
│   ├── server/               Server-only business logic
│   │   ├── ai/
│   │   │   ├── providers/    Bedrock/free-provider adapters and routing
│   │   │   └── tools/        Validated, read-only rental/landmark tools
│   │   ├── auth/             Session, role, and ownership checks
│   │   └── rentals/          Eligibility and PostGIS query services
│   ├── lib/                  Supabase clients and environment validation
│   ├── contracts/            Shared request/result validation and types
│   ├── types/                Generated database types and global declarations
│   └── styles/               Global styles and shared design tokens
├── public/                   Static public icons and brand images
├── supabase/
│   ├── migrations/           Versioned SQL schema, RLS, and PostGIS changes
│   ├── seeds/                Synthetic development seed SQL
│   └── tests/                Database/RLS/geographic SQL tests
├── tests/
│   ├── integration/          Server/API/database integration scenarios
│   ├── e2e/                  Playwright finder/landlord/admin/PWA journeys
│   ├── load/                 k6 scenarios with mocked model inference
│   ├── ai/                   Language/tool/fallback evaluation scenarios
│   └── fixtures/             Synthetic shared data and provider mocks
├── infra/
│   ├── docker/               Container support files
│   ├── caddy/                HTTPS/streaming proxy configuration
│   └── ec2/                  Host configuration and deployment support
├── scripts/                  dev, db, deploy automation
├── docs/
│   ├── project-structure.md  This contribution guide
│   └── technology-decisions/ Component sources, licenses, upgrade records
├── .github/workflows/        Future CI workflows
└── second-brain/             Existing external Obsidian symlink
```

## Route ownership

The home page and health API are implemented. Other paths below are reserved;
folders alone do not create working routes.

| Future URL | Folder | Responsibility |
| --- | --- | --- |
| / | src/app/(finder) | Map home with rental sheet and chat launcher |
| /rentals/:id | src/app/(finder)/rentals/[id] | Current public rental details |
| /account | src/app/(finder)/account | Finder account |
| /sign-in | src/app/(auth)/sign-in | Authentication UI |
| /auth/callback | src/app/auth/callback | Server authentication callback |
| /landlord | src/app/landlord | Landlord overview |
| /landlord/listings | src/app/landlord/listings | Own inventory |
| /landlord/listings/new | src/app/landlord/listings/new | Create listing |
| /landlord/listings/:id/edit | src/app/landlord/listings/[id]/edit | Edit owned listing |
| /admin | src/app/admin | Management overview |
| /admin/users | src/app/admin/users | Finder/landlord administration |
| /admin/listings | src/app/admin/listings | Listing moderation |
| /admin/landmarks | src/app/admin/landmarks | Verified places and aliases |
| /api/chat | src/app/api/chat | Bounded agent and streaming response |
| /api/rentals | src/app/api/rentals | Shared manual map/filter search |
| /api/health | src/app/api/health | Minimal health response |

Add page.tsx and layout.tsx when implementing pages, and route.ts for HTTP
endpoints. Route groups in parentheses do not alter the URL. The root layout
belongs at src/app/layout.tsx; the sole home page belongs in (finder)/page.tsx.
Do not add another root page that resolves to the same URL.
[Next.js folder conventions](https://nextjs.org/docs/app/getting-started/project-structure)

## Module boundaries

Keep routes thin: parse input, authenticate/authorize, call a service, and render
or return results. Organize feature components, hooks, state, schemas, and
colocated unit tests under their feature. Add subfolders when files need them.

Shared UI primitives belong in components/ui; app-wide layout belongs in
components/layout. Rental cards belong to features/listings so map and chat
can reuse the same public rental representation. Keep shared search criteria
and active selection in features/search. Features must not import app routes.

Code under server is server-only: add the server-only import guard when creating
modules. Browser components must never import it. AI tools call the same rental
service used by manual search, with validated contracts and database eligibility
checks. AI providers receive public results, not raw SQL or database credentials.
Turn limits and provider routing/accounting live under server/ai.

Keep browser/server Supabase clients in distinct files under lib/supabase;
mark server clients appropriately. Separate public and secret environment
validation in lib/env. Only explicitly public configuration may enter browser
bundles. Client-readable contracts must not depend on server modules.

Feature-specific types stay with their feature. contracts holds shared
request/result schemas; types holds generated database definitions and ambient
types. Do not place every TypeScript interface in a global types folder.

public contains only files safe to publish. Rental uploads belong in Supabase
Storage with appropriate access controls. Put PWA UI/registration under
features/pwa; add the Next.js manifest entry and actual worker during PWA
implementation. Do not create an empty service worker that appears functional.

## Team ownership

| Team responsibility | Main directories |
| --- | --- |
| Mobile, Map & PWA | src/features, src/components, src/styles, public, UI routes |
| Backend, Data & Agent | src/server, src/lib, src/contracts, src/types, supabase, API routes |
| Quality & Delivery | tests, infra, scripts, .github/workflows |
| Technical lead with relevant owners | Root framework/tooling files and shared interfaces |

Agree contracts before concurrent dependent work. Coordinate edits to shared
files and independently review authorization, migrations, tools, and workers.
Keep unit tests beside the behavior they exercise; cross-feature tests go in
tests. SQL permission tests belong in supabase/tests.

## Runtime and tooling placement

During the runnable scaffold, put package.json, its lockfile, TypeScript,
Next.js, lint/test configuration, Dockerfile, compose.yaml, and the production
Compose override at the repository root. Supporting container scripts live in
infra/docker; Caddy and EC2 materials use their own infra folders. These folders
hold implementation support files. Root Docker/Compose files now exist; EC2
deployment itself has not been performed.

The app and chatbot server run on EC2. Hosted Supabase development is recommended
for teammates, with optional CLI-managed local Supabase and separate production.
Version migrations before applying shared schema changes; wire supabase/seeds
through CLI configuration when initialized. Do not create a second database
stack in Compose or put the chatbot under Supabase Edge Functions by default.

Load tests exercise the real API/auth/tools/database with synthetic data and
mocked external models. Provider evaluation is separate from stress testing.
Git, tool indexing, and Docker context exclusions protect local secrets and the
external vault; only placeholder environment examples should be committed.

## Next implementation step

The framework, layout/map shell, TypeScript, linting, standalone build, Docker
files, and browser checks are initialized. Next, connect the hosted development
backend and implement the reviewed data/authorization/search path.
