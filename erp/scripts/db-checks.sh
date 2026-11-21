#!/usr/bin/env bash
# Runs supabase/tests/checks.sql against the local Supabase database and fails
# if any check is false or if checks are missing (e.g. a transaction aborted).
# Usage (after `npx supabase start` / `npx supabase db reset`):  bash scripts/db-checks.sh
set -euo pipefail
cd "$(dirname "$0")/.."

DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
out="$(psql "$DB_URL" -X -A -t -F ' | ' -f supabase/tests/checks.sql 2>&1)"
results="$(printf '%s\n' "$out" | grep -E '^[A-Z][0-9]+[a-z]? ' || true)"

total=$(printf '%s\n' "$results" | grep -c ' | ' || true)
failed=$(printf '%s\n' "$results" | grep -E '\| f$' || true)
expected=$(grep -oE "select '[A-Z][0-9]+[a-z]? " supabase/tests/checks.sql | wc -l)

printf '%s\n' "$results"
if [ -n "$failed" ]; then
  echo "FAILED checks:"; printf '%s\n' "$failed"; exit 1
fi
if [ "$total" -lt "$expected" ]; then
  echo "Only $total of $expected checks reported a result. Output:"; printf '%s\n' "$out"; exit 1
fi
echo "All $total database checks passed."
