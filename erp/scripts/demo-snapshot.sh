#!/usr/bin/env sh
# Snapshots the demo company from the LOCAL Supabase into src/lib/demo/snapshot.json.
# Demo mode (NEXT_PUBLIC_DEMO_MODE=1) serves the app from this file, no database needed.
#
# Run after `npx supabase db reset` (so it holds only the seed data, no test edits):
#   sh scripts/demo-snapshot.sh
set -eu
cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1

out=src/lib/demo/snapshot.json
mkdir -p "$(dirname "$out")"

docker exec -i -e PGPASSWORD=postgres supabase_db_erp \
  psql -h 127.0.0.1 -U postgres -d postgres -X -A -t -v ON_ERROR_STOP=1 > "$out" <<'SQL'
with demo as (
  select m.user_id, m.org_id
  from public.organization_members m
  join auth.users u on u.id = m.user_id
  where u.email = 'demo@constructai.test'
  limit 1
)
select json_build_object(
  'snapshotDate', current_date,
  'user', (select json_build_object('id', u.id, 'email', u.email, 'user_metadata', u.raw_user_meta_data)
           from auth.users u join demo d on d.user_id = u.id),
  'tables', json_build_object(
    'organizations', (select coalesce(json_agg(o), '[]') from public.organizations o join demo d on d.org_id = o.id),
    'organization_members', (select coalesce(json_agg(m), '[]') from public.organization_members m join demo d on d.org_id = m.org_id),
    'projects', (select coalesce(json_agg(t), '[]') from public.projects t join demo d using (org_id)),
    'project_summary', (select coalesce(json_agg(t), '[]') from public.project_summary t join demo d using (org_id)),
    'change_orders', (select coalesce(json_agg(t), '[]') from public.change_orders t join demo d using (org_id)),
    'expenses', (select coalesce(json_agg(t), '[]') from public.expenses t join demo d using (org_id)),
    'billings', (select coalesce(json_agg(t), '[]') from public.billings t join demo d using (org_id)),
    'billing_summary', (select coalesce(json_agg(t), '[]') from public.billing_summary t join demo d using (org_id)),
    'payments', (select coalesce(json_agg(t), '[]') from public.payments t join demo d using (org_id)),
    'boq_items', (select coalesce(json_agg(t), '[]') from public.boq_items t join demo d using (org_id)),
    'suppliers', (select coalesce(json_agg(t), '[]') from public.suppliers t join demo d using (org_id)),
    'purchase_orders', (select coalesce(json_agg(t), '[]') from public.purchase_orders t join demo d using (org_id)),
    'purchase_order_summary', (select coalesce(json_agg(t), '[]') from public.purchase_order_summary t join demo d using (org_id)),
    'purchase_order_items', (select coalesce(json_agg(t), '[]') from public.purchase_order_items t join demo d using (org_id)),
    'invitations', '[]'::json
  ),
  'org_members', (
    select coalesce(json_agg(json_build_object(
      'user_id', m.user_id, 'email', u.email, 'full_name', u.raw_user_meta_data->>'full_name',
      'role', m.role, 'joined_at', m.created_at) order by m.created_at), '[]')
    from public.organization_members m join auth.users u on u.id = m.user_id join demo d on d.org_id = m.org_id
  )
);
SQL

echo "Wrote $out ($(wc -c < "$out") bytes)"
