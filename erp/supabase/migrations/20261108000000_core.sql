-- ConstructAI ERP — core schema
-- Projects, costs, change orders, billings and payments for Philippine contractors.
-- Every row belongs to an organization (the contractor's company). Users only see
-- rows for organizations they are a member of.

-- ─── Organizations & membership ──────────────────────────────────────────────

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index organization_members_user_idx on public.organization_members(user_id);

-- Security definer so policies can call it without recursing into the
-- organization_members policy.
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where org_id = target_org and user_id = auth.uid()
  );
$$;

-- On signup, create the user's company and make them its owner.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_org uuid;
begin
  insert into public.organizations (name)
  values (coalesce(nullif(trim(new.raw_user_meta_data->>'company_name'), ''), 'My Company'))
  returning id into new_org;

  insert into public.organization_members (org_id, user_id, role)
  values (new_org, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Projects ────────────────────────────────────────────────────────────────

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  client_name text,
  location text,
  status text not null default 'active'
    check (status in ('bidding', 'active', 'on_hold', 'completed', 'cancelled')),
  contract_amount numeric(14, 2) not null default 0 check (contract_amount >= 0),
  budget numeric(14, 2) not null default 0 check (budget >= 0),
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now()
);

create index projects_org_idx on public.projects(org_id);

-- ─── Change orders (variation orders) ────────────────────────────────────────

create table public.change_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  description text not null,
  amount numeric(14, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index change_orders_project_idx on public.change_orders(project_id);

-- ─── Expenses (project costs and company overhead) ───────────────────────────

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  -- null = company overhead not tied to a project (office rent, salaries, etc.)
  project_id uuid references public.projects(id) on delete cascade,
  date date not null default current_date,
  category text not null
    check (category in ('materials', 'labor', 'subcontractor', 'equipment', 'permits', 'overhead', 'other')),
  description text not null,
  payee text,
  amount numeric(14, 2) not null check (amount > 0),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index expenses_org_date_idx on public.expenses(org_id, date desc);
create index expenses_project_idx on public.expenses(project_id);

-- ─── Billings (progress billings / invoices to the client) ───────────────────

create table public.billings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  reference text,
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  billed_date date not null default current_date,
  due_date date,
  created_at timestamptz not null default now()
);

create index billings_project_idx on public.billings(project_id);

-- ─── Payments received from the client ───────────────────────────────────────

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  billing_id uuid not null references public.billings(id) on delete cascade,
  date date not null default current_date,
  amount numeric(14, 2) not null check (amount > 0),
  method text not null default 'bank_transfer'
    check (method in ('cash', 'check', 'bank_transfer', 'gcash', 'maya', 'other')),
  reference text,
  created_at timestamptz not null default now()
);

create index payments_billing_idx on public.payments(billing_id);
create index payments_org_date_idx on public.payments(org_id, date desc);

-- Child rows must belong to the same organization as their project / billing,
-- so a member of one company can never attach rows to another company's project.
create or replace function public.check_same_org()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_org uuid;
begin
  if tg_table_name = 'payments' then
    select org_id into parent_org from public.billings where id = new.billing_id;
  elsif new.project_id is not null then
    select org_id into parent_org from public.projects where id = new.project_id;
  else
    return new;
  end if;

  if parent_org is distinct from new.org_id then
    raise exception 'Record must belong to the same organization as its parent';
  end if;
  return new;
end;
$$;

create trigger change_orders_same_org before insert or update on public.change_orders
  for each row execute function public.check_same_org();
create trigger expenses_same_org before insert or update on public.expenses
  for each row execute function public.check_same_org();
create trigger billings_same_org before insert or update on public.billings
  for each row execute function public.check_same_org();
create trigger payments_same_org before insert or update on public.payments
  for each row execute function public.check_same_org();

-- ─── Row level security ──────────────────────────────────────────────────────

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.change_orders enable row level security;
alter table public.expenses enable row level security;
alter table public.billings enable row level security;
alter table public.payments enable row level security;

create policy "members read their organization" on public.organizations
  for select using (public.is_org_member(id));
create policy "owners update their organization" on public.organizations
  for update using (
    exists (select 1 from public.organization_members m
            where m.org_id = id and m.user_id = auth.uid() and m.role = 'owner')
  );

create policy "members read memberships" on public.organization_members
  for select using (public.is_org_member(org_id));

create policy "members manage projects" on public.projects
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy "members manage change orders" on public.change_orders
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy "members manage expenses" on public.expenses
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy "members manage billings" on public.billings
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
create policy "members manage payments" on public.payments
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

-- ─── Reporting views (run with the caller's permissions, so RLS applies) ─────

create view public.billing_summary with (security_invoker = true) as
select
  b.*,
  coalesce(p.paid, 0)::numeric(14, 2) as paid,
  (b.amount - coalesce(p.paid, 0))::numeric(14, 2) as balance,
  case
    when coalesce(p.paid, 0) >= b.amount then 'paid'
    when b.due_date is not null and b.due_date < current_date then 'overdue'
    when coalesce(p.paid, 0) > 0 then 'partial'
    else 'unpaid'
  end as status
from public.billings b
left join (
  select billing_id, sum(amount) as paid from public.payments group by billing_id
) p on p.billing_id = b.id;

create view public.project_summary with (security_invoker = true) as
select
  pr.*,
  coalesce(co.approved, 0)::numeric(14, 2) as approved_change_orders,
  (pr.contract_amount + coalesce(co.approved, 0))::numeric(14, 2) as revised_contract,
  coalesce(ex.cost, 0)::numeric(14, 2) as cost_to_date,
  coalesce(bi.billed, 0)::numeric(14, 2) as billed,
  coalesce(bi.collected, 0)::numeric(14, 2) as collected,
  (coalesce(bi.billed, 0) - coalesce(bi.collected, 0))::numeric(14, 2) as receivable,
  coalesce(bi.overdue, 0)::numeric(14, 2) as overdue
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
         sum(case when status = 'overdue' then balance else 0 end) as overdue
  from public.billing_summary group by project_id
) bi on bi.project_id = pr.id;
