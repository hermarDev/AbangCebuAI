# Verification workspace

- integration: API/auth/tool/database flows across modules.
- e2e: finder, landlord, admin, mobile, and PWA journeys using Playwright.
- load: k6 against isolated data and real application tools with mocked models.
- ai: English/Cebuano/mixed-language evaluations and provider failure scenarios.
- fixtures: synthetic accounts, listings, landmarks, and deterministic mocks.

Feature unit tests live beside their implementations. SQL/RLS tests live in
../supabase/tests. Playwright is installed and foundation scenarios live in
e2e/foundation.spec.ts; run npm run build and npm run test:e2e.
The other suites remain reserved for their feature milestones.
Live model smoke tests must be bounded and separate from stress traffic.
