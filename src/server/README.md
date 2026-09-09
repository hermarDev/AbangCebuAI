# Server code

AI orchestration, provider adapters, bounded retries/accounting, validated
read-only tools, authorization, and rental query services live here.
Guard implementation modules with server-only when dependencies are initialized.

Manual rental search and AI tools share rentals services and eligibility rules.
Keep Supabase RLS and server checks authoritative. No browser imports, raw SQL
tools for models, or AI provider secrets in public configuration.

See [the structure guide](../../docs/project-structure.md) and
[the provider plan](../../second-brain/AI%20Providers%20and%20EC2%20Deployment.md).
