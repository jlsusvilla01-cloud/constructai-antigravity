-- Database checks for roles, invitations, progress billing and purchasing.
-- Local only. Run against the local Supabase after `npx supabase db reset`:
--   PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -X -A -t -f supabase/tests/checks.sql
-- Every "T…"/"P…" line must end in "t". Lines marked "(error above expected)" follow an
-- intentional failure. Everything runs in transactions that are rolled back.
-- Note: the seed already has a staff user; these checks create their own users.

\set ON_ERROR_STOP off
\set QUIET on
-- helper to act as a user
create or replace function pg_temp.act(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
end $$;

begin;
select id as demo from auth.users where email='demo@constructai.test' \gset
select org_id as org from organization_members where user_id = :'demo' \gset

-- owner creates an invitation
select pg_temp.act(:'demo');
insert into invitations (org_id, email, role) values (:'org', 'staff@test.ph', 'member') returning token as tok \gset
reset role;

-- attacker with token but different email: gets own company
insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('44444444-4444-4444-8444-444444444444', 'evil@test.ph', jsonb_build_object('invite_token', :'tok'), 'authenticated','authenticated');
select 'T1 attacker not in org' as t, not exists(select 1 from organization_members where user_id='44444444-4444-4444-8444-444444444444' and org_id=:'org') as pass;

-- staff signs up via invite: joins org as member, no new org
insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('55555555-5555-4555-8555-555555555555', 'Staff@Test.ph', jsonb_build_object('invite_token', :'tok', 'full_name','Staff One'), 'authenticated','authenticated');
select 'T2 staff joined as member' as t, (select role from organization_members where user_id='55555555-5555-4555-8555-555555555555') = 'member'
  and (select count(*) from organization_members where user_id='55555555-5555-4555-8555-555555555555') = 1 as pass;
select 'T3 invite consumed' as t, accepted_at is not null as pass from invitations where token=:'tok';

-- staff permissions
select pg_temp.act('55555555-5555-4555-8555-555555555555');
select 'T4 staff sees projects' as t, count(*) >= 4 as pass from projects;
select 'T5 staff sees team' as t, count(*) >= 2 as pass from org_members(:'org');
with d as (delete from expenses where org_id = :'org' returning 1) select 'T6 staff cannot delete costs' as t, count(*) = 0 as pass from d;
with d as (delete from projects returning 1) select 'T7 staff cannot delete projects' as t, count(*) = 0 as pass from d;
with u as (update organization_members set role='member' where user_id=:'demo' returning 1) select 'T8 staff cannot demote owner' as t, count(*)=0 as pass from u;
savepoint s1;
insert into invitations (org_id, email) values (:'org', 'x@test.ph');
rollback to s1;
select 'T9 staff invite blocked (error above expected)' as t, true as pass;
insert into expenses (org_id, project_id, category, description, amount) select :'org', id, 'materials', 'staff cost', 100 from projects limit 1;
select 'T10 staff can add costs' as t, count(*) = 1 as pass from expenses where description='staff cost';
reset role;

-- other company cannot see
select pg_temp.act('44444444-4444-4444-8444-444444444444');
select 'T11 outsider sees nothing' as t, (select count(*) from projects)=0 and (select count(*) from org_members(:'org'))=0 and (select count(*) from invitations)=0 as pass;
select 'T12 preview works for anyone' as t, (select org_name from invitation_preview(:'tok')) = 'Dela Cruz Builders' as pass;
reset role;

-- sole owner cannot demote self
select pg_temp.act(:'demo');
savepoint s2;
update organization_members set role='member' where user_id=:'demo';
rollback to s2;
select 'T13 sole owner demote blocked (error above expected)' as t, true as pass;
update organization_members set role='owner' where user_id='55555555-5555-4555-8555-555555555555';
update organization_members set role='member' where user_id=:'demo';
select 'T14 demote ok once another owner exists' as t, (select role from organization_members where user_id=:'demo')='member' as pass;
reset role;
select pg_temp.act('55555555-5555-4555-8555-555555555555');
update organization_members set role='owner' where user_id=:'demo';
reset role;
select pg_temp.act(:'demo');
update organization_members set role='member' where user_id='55555555-5555-4555-8555-555555555555';
reset role;

-- accept_invitation for an existing user
select pg_temp.act(:'demo');
insert into invitations (org_id, email, role) values (:'org', 'evil@test.ph', 'member') returning token as tok2 \gset
insert into invitations (org_id, email, role) values (:'org', 'someone@test.ph', 'member') returning token as tok3 \gset
reset role;
select pg_temp.act('44444444-4444-4444-8444-444444444444');
savepoint s3;
select accept_invitation(:'tok3');
rollback to s3;
select 'T15 wrong-email accept blocked (error above expected)' as t, true as pass;
select accept_invitation(:'tok2') is not null as accepted;
select 'T16 outsider now member of 2 companies' as t, (select count(*) from organization_members where user_id = '44444444-4444-4444-8444-444444444444') = 2 as pass;
with d as (delete from organization_members where user_id='44444444-4444-4444-8444-444444444444' and org_id=:'org' returning 1) select 'T17 member leaves' as t, count(*)=1 as pass from d;
reset role;
select 'T17b left' as t, (select count(*) from organization_members where user_id = '44444444-4444-4444-8444-444444444444') = 1 as pass;

-- Progress billing constraint
select pg_temp.act(:'demo');
insert into projects (org_id, name, contract_amount, budget) values (:'org', 'Check project', 1000000, 800000) returning id as proj \gset
savepoint s4;
insert into billings (org_id, project_id, description, amount, gross_amount, retention_amount, kind, percent_complete) values (:'org', :'proj', 'bad', 100, 120, 10, 'progress', 20);
rollback to s4;
select 'T18 net mismatch rejected (error above expected)' as t, true as pass;
insert into billings (org_id, project_id, description, amount, gross_amount, retention_amount, recoupment_amount, kind, percent_complete) values (:'org', :'proj', 'PB1', 800, 1000, 100, 100, 'progress', 30);
insert into billings (org_id, project_id, description, amount) values (:'org', :'proj', 'plain', 500);
select 'T19 plain billing gross=amount' as t, gross_amount = 500 as pass from billings where description='plain';
-- Work already billed counts fixed-amount ("other") billings too (1000 progress + 500 plain),
-- so a later progress billing can't charge that work again.
select 'T20 summary retention' as t, retention_held = 100 and downpayment_recouped = 100 and percent_complete = 30 and progress_billed_gross = 1500 as pass from project_summary where id=:'proj';
insert into billings (org_id, project_id, description, amount, kind) values (:'org', :'proj', 'DP', 200, 'downpayment');
select 'T20b downpayment not counted as work billed' as t, progress_billed_gross = 1500 and downpayment_billed = 200 as pass from project_summary where id=:'proj';

-- Purchasing
insert into suppliers (org_id, name) values (:'org', 'Check Supplier') returning id as sup \gset
savepoint s5;
insert into suppliers (org_id, name) values (:'org', 'check supplier');
rollback to s5;
select 'T21 duplicate supplier rejected (error above expected)' as t, true as pass;
insert into purchase_orders (org_id, project_id, supplier_id, po_number, notes) values (:'org', :'proj', :'sup', 'PO-9001', 'Cement') returning id as po \gset
insert into purchase_order_items (org_id, purchase_order_id, description, unit, quantity, unit_cost) values (:'org', :'po', 'Cement', 'bag', 100, 285), (:'org', :'po', 'Sand', 'cu.m', 3.5, 1200);
select 'T22 committed cost' as t, committed_cost = 32700 and payable = 0 as pass from project_summary where id=:'proj';
update purchase_orders set status='received', received_date=current_date where id=:'po';
select 'T23 payable' as t, payable = 32700 as pass from project_summary where id=:'proj';
select cost_to_date as cost_before from project_summary where id=:'proj' \gset
reset role;
select pg_temp.act('55555555-5555-4555-8555-555555555555');
select pay_purchase_order(:'po', current_date) is not null as paid;
select 'T24 paid -> cost recorded' as t, cost_to_date = :cost_before + 32700 and committed_cost = 0 and payable = 0 as pass from project_summary where id=:'proj';
select 'T25 summary paid date' as t, paid_date = current_date and total = 32700 as pass from purchase_order_summary where id=:'po';
savepoint s6;
update purchase_order_items set quantity = 1 where purchase_order_id=:'po';
rollback to s6;
select 'T26 paid PO items locked (error above expected)' as t, true as pass;
savepoint s7;
select unpay_purchase_order(:'po');
rollback to s7;
select 'T27 staff unpay blocked (error above expected)' as t, true as pass;
reset role;
select pg_temp.act(:'demo');
select unpay_purchase_order(:'po');
select 'T28 owner unpay' as t, expense_id is null as pass from purchase_orders where id=:'po';
select 'T29 cost removed' as t, cost_to_date = :cost_before as pass from project_summary where id=:'proj';

-- cross-org link attempt
reset role;
select org_id as org2 from organization_members where user_id='44444444-4444-4444-8444-444444444444' \gset
select pg_temp.act('44444444-4444-4444-8444-444444444444');
savepoint s8;
insert into suppliers (org_id, name) values (:'org2', 'Mine') returning id as sup2 \gset
insert into projects (org_id, name) values (:'org2', 'P2') returning id as proj2 \gset
insert into purchase_orders (org_id, project_id, supplier_id, po_number) values (:'org2', :'proj2', :'sup', 'PO-X');
rollback to s8;
select 'T30 foreign supplier rejected (error above expected)' as t, true as pass;
reset role;

-- deleting a project with a paid PO works (cascade)
select pg_temp.act(:'demo');
select pay_purchase_order(:'po', current_date) is not null as paid_again;
with d as (delete from projects where id=:'proj' returning 1) select 'T31 owner deletes project w/ paid PO' as t, count(*)=1 as pass from d;
reset role;
-- deleting the org cascades
delete from organizations where id=:'org';
select 'T32 org delete cascades' as t, not exists(select 1 from suppliers where org_id=:'org') as pass;
rollback;

begin;
select id as demo from auth.users where email='demo@constructai.test' \gset
select org_id as org from organization_members where user_id = :'demo' \gset
insert into projects (org_id, name, contract_amount, budget) values (:'org', 'Check project', 1000000, 800000) returning id as proj \gset
select set_config('role','authenticated',true), set_config('request.jwt.claims', json_build_object('sub', :'demo','role','authenticated')::text, true) \gset
insert into suppliers (org_id, name) values (:'org', 'Check Supplier A') returning id as sup \gset
select create_purchase_order(:'org', :'proj', :'sup', 'materials', null, 'ordered', null, null, 'Rebar', '[{"description":"Rebar 12mm","unit":"pc","quantity":100,"unit_cost":285.5},{"description":"Tie wire","unit":"roll","quantity":2,"unit_cost":1500}]') as po1 \gset
select create_purchase_order(:'org', :'proj', :'sup', 'materials', null, 'draft', null, null, null, '[{"description":"x","quantity":1,"unit_cost":1}]') as po2 \gset
select 'P1 numbering' as t, (select substring(po_number from 4)::int from purchase_orders where id = :'po2') = (select substring(po_number from 4)::int from purchase_orders where id = :'po1') + 1 as pass;
select 'P2 totals' as t, total = 31550 and item_count = 2 as pass from purchase_order_summary where id = :'po1';
select save_purchase_order_items(:'po1', '[{"description":"Rebar 16mm","unit":"pc","quantity":10,"unit_cost":500}]');
select 'P3 replace items' as t, total = 5000 and item_count = 1 as pass from purchase_order_summary where id = :'po1';
savepoint a; select save_purchase_order_items(:'po1', '[]'); rollback to a;
select 'P4 empty rejected' as t, true as pass;
select 'P5 draft not committed' as t, committed_cost = 5000 as pass from project_summary where id = :'proj';
rollback;

-- ─── Labor: workers, site log, payroll ──────────────────────────────────────
begin;
select id as demo from auth.users where email='demo@constructai.test' \gset
select id as staff from auth.users where email='staff@constructai.test' \gset
select org_id as org from organization_members where user_id = :'demo' \gset
insert into projects (org_id, name, contract_amount) values (:'org', 'Labor check project', 1000000) returning id as proj \gset
insert into auth.users (id, email, aud, role) values ('66666666-6666-4666-8666-666666666666', 'outsider@test.ph', 'authenticated', 'authenticated');
select org_id as org2 from organization_members where user_id = '66666666-6666-4666-8666-666666666666' \gset
select set_config('role','authenticated',true), set_config('request.jwt.claims', json_build_object('sub', :'staff','role','authenticated')::text, true) \gset
insert into workers (org_id, name, position, daily_rate) values (:'org', 'Check Mason', 'Mason', 800) returning id as w1 \gset
insert into workers (org_id, name, position, daily_rate) values (:'org', 'Check Helper', 'Helper', 600) returning id as w2 \gset
insert into attendance (org_id, project_id, worker_id, date, days, ot_hours) values (:'org', :'proj', :'w1', '2026-11-16', 1, 2);
insert into attendance (org_id, project_id, worker_id, date, days) values (:'org', :'proj', :'w2', '2026-11-16', 0.5);
insert into attendance (org_id, project_id, worker_id, date, days) values (:'org', :'proj', :'w1', '2026-11-25', 1);
select 'L1 rate copied, OT at 125%' as t, (select amount from attendance where worker_id = :'w1' and date = '2026-11-16') = 1050 as pass;
select 'L2 unpaid labor on summary' as t, unpaid_labor = 2150 as pass from project_summary where id = :'proj';
update workers set daily_rate = 900 where id = :'w1';
select 'L3 raise does not change past entries' as t, (select amount from attendance where worker_id = :'w1' and date = '2026-11-16') = 1050 as pass;
savepoint a; insert into attendance (org_id, project_id, worker_id, date) values (:'org', :'proj', :'w1', '2026-11-16'); rollback to a;
select 'L4 same worker twice a day rejected (error above expected)' as t, true as pass;
select cost_to_date as cost0 from project_summary where id = :'proj' \gset
select record_payroll(:'proj', '2026-11-16', '2026-11-22', '2026-11-22') as run \gset
select 'L5 payroll records labor cost' as t, cost_to_date = :cost0 + 1350 and unpaid_labor = 800 as pass from project_summary where id = :'proj';
select 'L6 run totals' as t, total = 1350 and worker_count = 2 as pass from payroll_runs where id = :'run';
savepoint b; update attendance set days = 0.5 where worker_id = :'w2'; rollback to b;
select 'L7 paid day locked (error above expected)' as t, true as pass;
savepoint c; select record_payroll(:'proj', '2026-11-16', '2026-11-22'); rollback to c;
select 'L8 nothing left to pay (error above expected)' as t, true as pass;
savepoint d; select undo_payroll(:'run'); rollback to d;
select 'L9 staff undo blocked (error above expected)' as t, true as pass;
reset role;
select set_config('role','authenticated',true), set_config('request.jwt.claims', json_build_object('sub', :'demo','role','authenticated')::text, true) \gset
select undo_payroll(:'run');
select 'L10 owner undo removes cost, unlocks days' as t, cost_to_date = :cost0 and unpaid_labor = 2150 as pass from project_summary where id = :'proj';
select record_payroll(:'proj', '2026-11-16', '2026-11-30') as run2 \gset
select expense_id as exp2 from payroll_runs where id = :'run2' \gset
delete from expenses where id = :'exp2';
select 'L11 deleting the labor cost undoes the payroll' as t, not exists (select 1 from payroll_runs where id = :'run2') and (select count(*) from attendance where project_id = :'proj' and payroll_run_id is null) = 3 as pass;
select record_payroll(:'proj', '2026-11-16', '2026-11-30') is not null as paid_again;
reset role;
select set_config('role','authenticated',true), set_config('request.jwt.claims', json_build_object('sub', '66666666-6666-4666-8666-666666666666','role','authenticated')::text, true) \gset
select 'L12 outsider sees no workers or site log' as t, (select count(*) from workers) = 0 and (select count(*) from attendance) = 0 and (select count(*) from payroll_runs) = 0 as pass;
insert into projects (org_id, name) values (:'org2', 'Outsider P') returning id as p2 \gset
savepoint e; insert into attendance (org_id, project_id, worker_id, date) values (:'org2', :'p2', :'w1', '2026-11-17'); rollback to e;
select 'L13 other company''s worker rejected (error above expected)' as t, true as pass;
reset role;
select set_config('role','authenticated',true), set_config('request.jwt.claims', json_build_object('sub', :'demo','role','authenticated')::text, true) \gset
with d as (delete from projects where id = :'proj' returning 1) select 'L14 owner deletes project with paid payroll' as t, count(*) = 1 as pass from d;
reset role;
delete from organizations where id = :'org';
select 'L15 company delete cascades' as t, not exists (select 1 from workers where org_id = :'org') as pass;
rollback;
