# Team automation

dev: application startup/shutdown and optional local Supabase coordination.
db: type generation, controlled migrations, and synthetic seed workflows.
deploy: EC2 rollout, health verification, and rollback helpers.

The root scripts now copy MapLibre worker assets, prepare the standalone build,
and start the production server. npm scripts call them automatically.
The dev/db/deploy subdirectories remain available for later automation.
Normal stop/start must preserve data. Resets must identify an isolated target.
