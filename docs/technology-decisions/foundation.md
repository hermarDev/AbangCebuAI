# Foundation components and dependencies

Recorded 2026-09-07. Exact versions are pinned in package.json and package-lock.json.
This is an implementation record; product decisions stay in the vault.

| Tool | Version | License | Source and purpose |
| --- | --- | --- | --- |
| Next.js / React | 16.3.4 / 19.2.8 | MIT | [Next.js](https://nextjs.org/docs/app/getting-started/installation), [React](https://react.dev/): App Router and components |
| Tailwind CSS | 4.3.3 | MIT | [Tailwind](https://tailwindcss.com/docs): utility styling |
| shadcn CLI / Radix | 4.21.0 / 1.6.7 | MIT | [shadcn](https://ui.shadcn.com/docs): generated Button/Dialog, radix-nova preset |
| cn | 0.2.6 | MIT | Utility dependency selected by the current shadcn generator |
| MapLibre GL JS | 6.7.0 | BSD-3-Clause | [MapLibre](https://maplibre.org/maplibre-gl-js/docs/): map with explicitly served worker/shared module |
| Lucide React | 1.42.0 | ISC | [Lucide](https://lucide.dev/): interface icons |
| Manrope / DM Serif Display | 5.3.0 / 5.3.0 | OFL-1.1 | [Fontsource](https://fontsource.org/): locally served typography |
| Supabase SSR | 0.12.6 | MIT | [Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client): browser/route client factories |
| Zod | 4.5.4 | MIT | [Zod](https://zod.dev/): environment validation |
| AI SDK / Bedrock / Groq adapters | 7.0.93 / 5.0.76 / 4.0.37 | Apache-2.0 | Installed for the future agent; no inference invoked |
| Playwright | 1.63.0 | Apache-2.0 | [Playwright](https://playwright.dev/): desktop/mobile foundation checks |

OpenFreeMap supplies the public map style/tiles; attribution stays visible.
Map data licensing is distinct from MapLibre's code license. Consult
[OpenFreeMap](https://openfreemap.org/) before changing attribution or caching.

Local customization: warm background/forest green palette, Manrope body and
DM Serif headings, map/list proportions, rental empty state, and chat launcher/
dialog. No generic rental template or fabricated listing content was copied.
shadcn source license and font licenses are in ../licenses. The MapLibre worker
copy script includes its license alongside generated assets.

Design status: the owner confirmed on 2026-09-07 that this preview is not the
final look. Its palette, typography, wordmark, and house icon are provisional.
Future work will address color theory, chosen colors, and the logo. See the
vault's Session Log - 2026-09-07 for the handoff; these implementation records
do not constitute brand approval.

Accessibility checks: semantic headings/regions, visible focus, skip link,
Radix dialog keyboard/Escape/focus restoration, responsive width, map failure
recovery, and visible attribution. Playwright verifies the dialog and overflow
on desktop/mobile Chromium. This is not a completed WCAG or physical-device audit.

Upgrade notes: regenerate components with shadcn only after reviewing diffs;
preserve local styles. Keep MapLibre worker/shared files from exactly the same
package version, and rerun live-map plus asset/failure checks. Fonts remain
local to avoid network-dependent builds. ESLint 9 is a temporary compatibility
pin until Next.js's bundled React plugin supports ESLint 10.
