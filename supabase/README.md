# Database workspace

migrations: reviewed versioned SQL for schema, RLS, and PostGIS.
seeds: synthetic development seed SQL, wired into CLI configuration at setup.
tests: database authorization, eligibility, and geographic query checks.

The CLI is not initialized yet. Hosted development is recommended for teammates;
local Supabase is optional for isolation. Production is a separate project.
Do not run destructive tests or reset commands against shared/production data.
