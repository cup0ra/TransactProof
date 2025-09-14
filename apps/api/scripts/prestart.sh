#!/usr/bin/env sh
set -eu

missing=0
for v in DATABASE_URL JWT_SECRET ; do
  val=$(eval echo "\${$v-}")
  if [ -z "${val:-}" ]; then
    echo "ERROR: $v is not set or empty"
    missing=1
  fi
done

if [ "$missing" -eq 1 ]; then
  echo "Set required variables in your environment (e.g., Railway → Variables) and redeploy."
  exit 1
fi

# Check browser setup
echo "🔍 Checking browser setup..."
node ./scripts/check-browser.js

exit 0

