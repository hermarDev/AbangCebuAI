# Infrastructure workspace

docker holds container support files; caddy holds HTTPS/streaming proxy
configuration; ec2 holds future host/deployment support. Root Dockerfile,
compose.yaml (development), and compose.production.yaml (production) now exist.
See ../docs/development.md for startup and verification commands.

EC2 runs the Next.js Node server and chatbot API. Supabase stays hosted.
Use an EC2 IAM role for Bedrock and runtime secrets for other credentials.
Health checks, proxy streaming, image rollback, and recovery must be verified
before deployment. No AWS infrastructure has been provisioned.
