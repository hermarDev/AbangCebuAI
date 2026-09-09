# Feature modules

Map owns map rendering and pins; search owns shared criteria/results/selection.
Listings owns rental cards and details; chat owns conversation UI. Auth owns
sign-in UI; landlord and admin own their management interfaces; pwa owns install,
update, and offline UI.

Keep feature components, hooks, and unit tests together. Add nested folders only
when needed. Use shared contracts for pins, cards, and agent recommendations.
Server logic belongs in ../server, not browser-facing feature modules.

See [the structure guide](../../docs/project-structure.md).
