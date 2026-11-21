-- Company details for printed documents, and labor: workers, daily site log
-- (attendance + site diary) and payroll runs that post labor cost to a project.

-- ─── Company details (shown on billing statements, receipts, POs) ────────────

alter table public.organizations
  add column address text,
  add column tin text,
  add column phone text,
  add column email text;

-- ─── Workers ─────────────────────────────────────────────────────────────────

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  position text,
  daily_rate numeric(10, 2) not null default 0 check (daily_rate >= 0),
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index workers_org_name_idx on public.workers(org_id, lower(name));

-- ─── Payroll runs ────────────────────────────────────────────────────────────
-- A payroll run pays the site log entries of one project for a period. Recording
-- it creates one labor cost (expense_id) for the total.

create table public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  total numeric(14, 2) not null default 0,
  worker_count integer not null default 0,
  -- Deleting the labor cost (e.g. from the Costs page) undoes the payroll too,
  -- which unlocks its site log entries.
  expense_id uuid unique references public.expenses(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create index payroll_runs_project_idx on public.payroll_runs(project_id, period_end desc);

-- ─── Attendance (who worked where, each day) ─────────────────────────────────
-- pay = days × daily rate + overtime hours × (daily rate ÷ 8) × 1.25
-- The daily rate is copied from the worker when the entry is made, so later
-- raises don't change past pay.

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  date date not null,
  days numeric(3, 2) not null default 1 check (days > 0 and days <= 1),
  ot_hours numeric(4, 1) not null default 0 check (ot_hours >= 0 and ot_hours <= 16),
  daily_rate numeric(10, 2) not null check (daily_rate >= 0),
  amount numeric(14, 2) generated always as (round(days * daily_rate + ot_hours * daily_rate / 8 * 1.25, 2)) stored,
  payroll_run_id uuid references public.payroll_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (worker_id, date)
);

create index attendance_project_date_idx on public.attendance(project_id, date);
create index attendance_run_idx on public.attendance(payroll_run_id);

-- ─── Daily site log (diary) ──────────────────────────────────────────────────

create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  date date not null,
  weather text,
  work_done text,
  issues text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now(),
  unique (project_id, date)
);

-- ─── Integrity ───────────────────────────────────────────────────────────────

create or replace function public.check_labor_links()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_org uuid;
begin
  select org_id into parent_org from public.projects where id = new.project_id;
  if parent_org is distinct from new.org_id then
    raise exception 'Record must belong to the same organization as its project';
  end if;
  if tg_table_name = 'attendance' then
    select org_id into parent_org from public.workers where id = new.worker_id;
    if parent_org is distinct from new.org_id then
      raise exception 'Worker belongs to a different organization';
    end if;
  end if;
  return new;
end;
$$;

create trigger attendance_links before insert or update on public.attendance
  for each row execute function public.check_labor_links();
create trigger daily_logs_links before insert or update on public.daily_logs
  for each row execute function public.check_labor_links();
create trigger payroll_runs_links before insert or update on public.payroll_runs
  for each row execute function public.check_labor_links();

-- Fill in the daily rate from the worker; lock entries already paid in a payroll run.
create or replace function public.attendance_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.daily_rate is null then
      select daily_rate into new.daily_rate from public.workers where id = new.worker_id;
    end if;
    if new.payroll_run_id is not null then
      raise exception 'New entries can''t be added to a recorded payroll.';
    end if;
    return new;
  end if;

  if old.payroll_run_id is not null then
    -- Allowed: the payroll run itself being undone (its id is cleared), or a
    -- row being deleted along with its project or company.
    if tg_op = 'UPDATE' and new.payroll_run_id is null
       and (new.days, new.ot_hours, new.daily_rate, new.date, new.worker_id, new.project_id)
           is not distinct from (old.days, old.ot_hours, old.daily_rate, old.date, old.worker_id, old.project_id) then
      return new;
    end if;
    if tg_op = 'DELETE' and (not exists (select 1 from public.projects where id = old.project_id)
                             or not exists (select 1 from public.organizations where id = old.org_id)) then
      return old;
    end if;
    raise exception 'This day is already in a recorded payroll. Undo that payroll first.';
  end if;

  if tg_op = 'UPDATE' and new.payroll_run_id is not null and old.payroll_run_id is null
     and (new.days, new.ot_hours, new.daily_rate) is distinct from (old.days, old.ot_hours, old.daily_rate) then
    raise exception 'Can''t change an entry while adding it to a payroll.';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger attendance_guard before insert or update or delete on public.attendance
  for each row execute function public.attendance_guard();

-- ─── Row level security ──────────────────────────────────────────────────────

alter table public.workers enable row level security;
alter table public.attendance enable row level security;
alter table public.daily_logs enable row level security;
alter table public.payroll_runs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['workers', 'attendance', 'daily_logs', 'payroll_runs'] loop
    execute format('create policy "members read" on public.%I for select using (public.is_org_member(org_id))', t);
    execute format('create policy "members add" on public.%I for insert with check (public.is_org_member(org_id))', t);
    execute format(
      'create policy "members edit" on public.%I for update using (public.is_org_member(org_id)) with check (public.is_org_member(org_id))', t);
    execute format('create policy "owners delete" on public.%I for delete using (public.is_org_owner(org_id))', t);
  end loop;
end;
$$;

-- Staff correct the site log as they go, so they may remove unpaid attendance entries
-- (paid ones are locked by the trigger above).
drop policy "owners delete" on public.attendance;
create policy "members delete" on public.attendance for delete using (public.is_org_member(org_id));

-- ─── Recording / undoing a payroll ───────────────────────────────────────────

create or replace function public.record_payroll(p_project uuid, p_start date, p_end date, p_paid_on date default current_date)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  proj public.projects%rowtype;
  v_total numeric(14, 2);
  v_workers integer;
  v_expense uuid;
  v_run uuid;
begin
  if p_end < p_start then
    raise exception 'The period ends before it starts.';
  end if;
  select * into proj from public.projects where id = p_project;
  if not found then
    raise exception 'Project not found.';
  end if;
  perform pg_advisory_xact_lock(hashtext('payroll:' || p_project::text));

  select coalesce(sum(amount), 0), count(distinct worker_id) into v_total, v_workers
  from public.attendance
  where project_id = p_project and date between p_start and p_end and payroll_run_id is null;
  if v_workers = 0 or v_total <= 0 then
    raise exception 'No unpaid site log entries in that period.';
  end if;

  insert into public.expenses (org_id, project_id, date, category, description, payee, amount)
  values (proj.org_id, p_project, coalesce(p_paid_on, current_date), 'labor',
          'Payroll ' || to_char(p_start, 'Mon DD') || ' – ' || to_char(p_end, 'Mon DD, YYYY'),
          v_workers || case when v_workers = 1 then ' worker' else ' workers' end, v_total)
  returning id into v_expense;

  insert into public.payroll_runs (org_id, project_id, period_start, period_end, total, worker_count, expense_id)
  values (proj.org_id, p_project, p_start, p_end, v_total, v_workers, v_expense)
  returning id into v_run;

  update public.attendance set payroll_run_id = v_run
  where project_id = p_project and date between p_start and p_end and payroll_run_id is null;

  return v_run;
end;
$$;

-- Owners only: removes the labor cost and unlocks the site log entries.
create or replace function public.undo_payroll(p_run uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  run public.payroll_runs%rowtype;
begin
  select * into run from public.payroll_runs where id = p_run;
  if not found then
    raise exception 'Payroll not found.';
  end if;
  if not public.is_org_owner(run.org_id) then
    raise exception 'Only an owner can undo a payroll.';
  end if;
  delete from public.payroll_runs where id = p_run;  -- clears attendance.payroll_run_id
  if run.expense_id is not null then
    delete from public.expenses where id = run.expense_id;
  end if;
end;
$$;

revoke execute on function public.record_payroll(uuid, date, date, date) from anon;
revoke execute on function public.undo_payroll(uuid) from anon;

-- ─── Project summary: add unpaid labor ───────────────────────────────────────

create or replace view public.project_summary with (security_invoker = true) as
select
  pr.*,
  coalesce(co.approved, 0)::numeric(14, 2) as approved_change_orders,
  (pr.contract_amount + coalesce(co.approved, 0))::numeric(14, 2) as revised_contract,
  coalesce(ex.cost, 0)::numeric(14, 2) as cost_to_date,
  coalesce(bi.billed, 0)::numeric(14, 2) as billed,
  coalesce(bi.collected, 0)::numeric(14, 2) as collected,
  (coalesce(bi.billed, 0) - coalesce(bi.collected, 0))::numeric(14, 2) as receivable,
  coalesce(bi.overdue, 0)::numeric(14, 2) as overdue,
  -- progress billing
  coalesce(bi.progress_gross, 0)::numeric(14, 2) as progress_billed_gross,
  coalesce(bi.percent_complete, 0)::numeric(5, 2) as percent_complete,
  coalesce(bi.downpayment_billed, 0)::numeric(14, 2) as downpayment_billed,
  coalesce(bi.recouped, 0)::numeric(14, 2) as downpayment_recouped,
  (coalesce(bi.retention_withheld, 0) - coalesce(bi.retention_released, 0))::numeric(14, 2) as retention_held,
  -- BOQ & purchasing
  coalesce(bq.boq_total, 0)::numeric(14, 2) as boq_total,
  coalesce(po.committed, 0)::numeric(14, 2) as committed_cost,
  coalesce(po.payable, 0)::numeric(14, 2) as payable,
  -- Labor recorded on the site log but not yet in a payroll run (a cost not yet in expenses).
  coalesce(lb.unpaid_labor, 0)::numeric(14, 2) as unpaid_labor
from public.projects pr
left join (
  select project_id, sum(amount) as approved
  from public.change_orders where status = 'approved' group by project_id
) co on co.project_id = pr.id
left join (
  select project_id, sum(amount) as cost
  from public.expenses where project_id is not null group by project_id
) ex on ex.project_id = pr.id
left join (
  select project_id,
         sum(amount) as billed,
         sum(paid) as collected,
         sum(case when status = 'overdue' then balance else 0 end) as overdue,
         -- Work already billed: progress billings plus fixed-amount ("other") billings,
         -- e.g. billings entered before progress billing existed. Without the latter,
         -- the first progress billing would charge that work to the client again.
         sum(case when kind in ('progress', 'other') then gross_amount else 0 end) as progress_gross,
         max(case when kind = 'progress' then percent_complete end) as percent_complete,
         sum(case when kind = 'downpayment' then gross_amount else 0 end) as downpayment_billed,
         sum(recoupment_amount) as recouped,
         sum(retention_amount) as retention_withheld,
         sum(case when kind = 'retention_release' then amount else 0 end) as retention_released
  from public.billing_summary group by project_id
) bi on bi.project_id = pr.id
left join (
  select project_id, sum(amount) as boq_total from public.boq_items group by project_id
) bq on bq.project_id = pr.id
left join (
  select project_id,
         sum(total) filter (where status in ('ordered', 'received')) as committed,
         sum(total) filter (where status = 'received') as payable
  from public.purchase_order_summary
  where expense_id is null
  group by project_id
) po on po.project_id = pr.id
left join (
  select project_id, sum(amount) as unpaid_labor
  from public.attendance where payroll_run_id is null group by project_id
) lb on lb.project_id = pr.id;
