#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="hermardev/abangcebuai"
TAG="${1:-latest}"
FULL_IMAGE="${IMAGE_NAME}:${TAG}"

echo "=================================================="
echo " Building & Pushing Docker Image: ${FULL_IMAGE}"
echo "=================================================="

# 1. Load build-time environment variables from .env.local or .env if available
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
SUPABASE_KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"

if [ -f ".env.local" ]; then
  echo "--> Reading build variables from .env.local..."
  if [ -z "$SUPABASE_URL" ]; then
    SUPABASE_URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d '=' -f2- | tr -d '\r"' || true)
  fi
  if [ -z "$SUPABASE_KEY" ]; then
    SUPABASE_KEY=$(grep -E '^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=' .env.local | cut -d '=' -f2- | tr -d '\r"' || true)
    if [ -z "$SUPABASE_KEY" ]; then
      SUPABASE_KEY=$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d '=' -f2- | tr -d '\r"' || true)
    fi
  fi
fi

echo "--> Target: production"
echo "--> Supabase URL: ${SUPABASE_URL:-[not set - will fallback to synthetic preview]}"

# 2. Build production image with Next.js build arguments
echo "--> Building Docker image ${FULL_IMAGE}..."
docker build \
  --target production \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${SUPABASE_KEY}" \
  -t "${FULL_IMAGE}" \
  .

# 3. Push to Docker Hub
echo "--> Pushing ${FULL_IMAGE} to Docker Hub..."
docker push "${FULL_IMAGE}"

echo ""
echo "=================================================="
echo " Successfully pushed ${FULL_IMAGE} to Docker Hub!"
echo " Team can now pull it using:"
echo "   docker pull ${FULL_IMAGE}"
echo " Or run it with:"
echo "   docker run -p 3000:3000 ${FULL_IMAGE}"
echo "=================================================="
