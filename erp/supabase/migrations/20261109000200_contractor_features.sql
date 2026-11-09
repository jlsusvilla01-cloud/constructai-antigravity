-- Progress billing with retention and downpayment recoupment, bill of quantities
-- (BOQ), suppliers and purchase orders.

-- ─── Progress billing, retention, downpayment ────────────────────────────────
--
-- Typical Philippine construction contract:
--   • Downpayment (advance) of e.g. 15% of the contract, billed up front.
--   • Progress billings by % of work accomplished. From each one the client
--     withholds retention (usually 10%) and recoups the downpayment in proportion.
--   • Retention is released after completion / the guarantee period.
--
-- For every billing:  amount (net, what the client pays) =
--                     gross_amount − retention_amount − recoupment_amount

alter table public.projects
  add column retention_pct numeric(5, 2) not null default 0 check (retention_pct between 0 and 100),
  add column downpayment_pct numeric(5, 2) not null default 0 check (downpayment_pct between 0 and 100);

alter table public.billings
  add column kind text not null default 'other'
    check (kind in ('downpayment', 'progress', 'retention_release', 'other')),
  add column percent_complete numeric(5, 2) check (percent_complete between 0 and 100),
  add column gross_amount numeric(14, 2),
  add column retention_amount numeric(14, 2) not null default 0 check (retention_amount >= 0),
  add column recoupment_amount numeric(14, 2) not null default 0 check (recoupment_amount >= 0);

update public.billings set gross_amount = amount where gross_amount is null;

-- Rows inserted without a gross amount (plain billings) are gross = net.
create or replace function public.billing_fill_gross()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.gross_amount is null then
    new.gross_amount := new.amount + new.retention_amount + new.recoupment_amount;
  end if;
  return new;
end;
$$;

create trigger billings_fill_gross before insert or update on public.billings
  for each row execute function public.billing_fill_gross();

alter table public.billings
  alter column gross_amount set not null,
  add constraint billings_net_matches check (amount = gross_amount - retention_amount - recoupment_amount),
  add constraint billings_progress_has_pct check (kind <> 'progress' or percent_complete is not null);

-- ─── Bill of quantities ──────────────────────────────────────────────────────

create table public.boq_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  item_no text,
  description text not null,
  category text not null default 'materials'
    check (category in ('materials', 'labor', 'subcontractor', 'equipment', 'permits', 'overhead', 'other')),
  unit text,
  quantity numeric(14, 3) not null default 1 check (quantity >= 0),
  unit_cost numeric(14, 2) not null default 0 check (unit_cost >= 0),
  amount numeric(14, 2) generated always as (round(quantity * unit_cost, 2)) stored,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index boq_items_project_idx on public.boq_items(project_id, sort_order);

-- Costs can be charged to a BOQ line, for budget vs. actual per line.
alter table public.expenses
  add column boq_item_id uuid references public.boq_items(id) on delete set null;

create index expenses_boq_item_idx on public.expenses(boq_item_id);

-- ─── Suppliers ───────────────────────────────────────────────────────────────

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_person text,
  phone text,
  email text,
  tin text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

create unique index suppliers_org_name_idx on public.suppliers(org_id, lower(name));

-- ─── Purchase orders ─────────────────────────────────────────────────────────
--
-- status is the delivery status: draft → ordered → received (or cancelled).
-- Paying a PO records it as a project cost (expense_id). Until then, ordered and
-- received POs count as committed cost; received-but-unpaid POs are payables.

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id),  -- no action: suppliers with POs can't be deleted
  po_number text not null,
  category text not null default 'materials'
    check (category in ('materials', 'labor', 'subcontractor', 'equipment', 'permits', 'overhead', 'other')),
  boq_item_id uuid references public.boq_items(id) on delete set null,
  status text not null default 'ordered' check (status in ('draft', 'ordered', 'received', 'cancelled')),
  order_date date not null default current_date,
  expected_date date,
  received_date date,
  notes text,
  expense_id uuid unique references public.expenses(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (org_id, po_number)
);

create index purchase_orders_project_idx on public.purchase_orders(project_id);
create index purchase_orders_supplier_idx on public.purchase_orders(supplier_id);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  description text not null,
  unit text,
  quantity numeric(14, 3) not null check (quantity > 0),
  unit_cost numeric(14, 2) not null check (unit_cost >= 0),
  amount numeric(14, 2) generated always as (round(quantity * unit_cost, 2)) stored,
  sort_order integer not null default 0
);

create index purchase_order_items_po_idx on public.purchase_order_items(purchase_order_id, sort_order);

-- ─── Integrity: linked rows must belong to the same company / project ────────

create or replace function public.check_links()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_org uuid;
  parent_project uuid;
begin
  if tg_table_name = 'boq_items' then
    select org_id into parent_org from public.projects where id = new.project_id;
    if parent_org is distinct from new.org_id then
      raise exception 'Record must belong to the same organization as its parent';
    end if;

  elsif tg_table_name = 'expenses' then
    if new.boq_item_id is not null then
      select project_id into parent_project from public.boq_items where id = new.boq_item_id;
      if parent_project is distinct from new.project_id then
        raise exception 'BOQ line belongs to a different project';
      end if;
    end if;

  elsif tg_table_name = 'purchase_orders' then
    select org_id into parent_org from public.projects where id = new.project_id;
    if parent_org is distinct from new.org_id then
      raise exception 'Record must belong to the same organization as its parent';
    end if;
    select org_id into parent_org from public.suppliers where id = new.supplier_id;
    if parent_org is distinct from new.org_id then
      raise exception 'Supplier belongs to a different organization';
    end if;
    if new.boq_item_id is not null then
      select project_id into parent_project from public.boq_items where id = new.boq_item_id;
      if parent_project is distinct from new.project_id then
        raise exception 'BOQ line belongs to a different project';
      end if;
    end if;
    if new.expense_id is not null then
      select org_id into parent_org from public.expenses where id = new.expense_id;
      if parent_org is distinct from new.org_id then
        raise exception 'Cost belongs to a different organization';
      end if;
    end if;

  elsif tg_table_name = 'purchase_order_items' then
    select org_id into parent_org from public.purchase_orders where id = new.purchase_order_id;
    if parent_org is distinct from new.org_id then
      raise exception 'Record must belong to the same organization as its parent';
    end if;
  end if;
  return new;
end;
$$;

create trigger boq_items_links before insert or update on public.boq_items
  for each row execute function public.check_links();
create trigger expenses_links before insert or update on public.expenses
  for each row execute function public.check_links();
create trigger purchase_orders_links before insert or update on public.purchase_orders
  for each row execute function public.check_links();
create trigger purchase_order_items_links before insert or update on public.purchase_order_items
  for each row execute function public.check_links();

-- A paid PO's lines are locked (the cost has already been recorded).
create or replace function public.lock_paid_po_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  po uuid := coalesce(new.purchase_order_id, old.purchase_order_id);
begin
  if exists (select 1 from public.purchase_orders where id = po and expense_id is not null) then
    raise exception 'This PO is already paid. Mark it unpaid before changing its items.';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger purchase_order_items_lock before insert or update or delete on public.purchase_order_items
  for each row execute function public.lock_paid_po_items();

-- ─── Row level security ──────────────────────────────────────────────────────

alter table public.boq_items enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['boq_items', 'suppliers', 'purchase_orders', 'purchase_order_items'] loop
    execute format('create policy "members read" on public.%I for select using (public.is_org_member(org_id))', t);
    execute format('create policy "members add" on public.%I for insert with check (public.is_org_member(org_id))', t);
    execute format(
      'create policy "members edit" on public.%I for update using (public.is_org_member(org_id)) with check (public.is_org_member(org_id))', t);
    execute format('create policy "owners delete" on public.%I for delete using (public.is_org_owner(org_id))', t);
  end loop;
end;
$$;

-- Staff build BOQs and PO lines, so they may also remove BOQ / PO lines while
-- editing (the parent project / PO can only be deleted by an owner).
drop policy "owners delete" on public.boq_items;
create policy "members delete" on public.boq_items for delete using (public.is_org_member(org_id));
drop policy "owners delete" on public.purchase_order_items;
create policy "members delete" on public.purchase_order_items for delete using (public.is_org_member(org_id));

-- ─── Creating / editing a PO with its items in one step ─────────────────────
-- Both run with the caller's permissions (RLS applies). items is a JSON array of
-- {"description", "unit", "quantity", "unit_cost"}.

create or replace function public.save_purchase_order_items(po_id uuid, items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  po_org uuid;
begin
  select org_id into po_org from public.purchase_orders where id = po_id;
  if po_org is null then
    raise exception 'Purchase order not found.';
  end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'Add at least one item.';
  end if;

  delete from public.purchase_order_items where purchase_order_id = po_id;
  insert into public.purchase_order_items (org_id, purchase_order_id, description, unit, quantity, unit_cost, sort_order)
  select po_org, po_id, trim(i->>'description'), nullif(trim(i->>'unit'), ''),
         (i->>'quantity')::numeric, (i->>'unit_cost')::numeric, (ord - 1)::integer
  from jsonb_array_elements(items) with ordinality as t(i, ord);
end;
$$;

create or replace function public.create_purchase_order(
  p_org uuid,
  p_project uuid,
  p_supplier uuid,
  p_category text,
  p_boq_item uuid,
  p_status text,
  p_order_date date,
  p_expected_date date,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_no integer;
  new_id uuid;
begin
  if not public.is_org_member(p_org) then
    raise exception 'Not allowed.';
  end if;
  -- One PO number at a time per company.
  perform pg_advisory_xact_lock(hashtext('po:' || p_org::text));
  select coalesce(max(substring(po_number from '^PO-(\d+)$')::integer), 0) + 1 into next_no
  from public.purchase_orders where org_id = p_org;

  insert into public.purchase_orders
    (org_id, project_id, supplier_id, po_number, category, boq_item_id, status, order_date, expected_date, notes)
  values
    (p_org, p_project, p_supplier, 'PO-' || lpad(next_no::text, 4, '0'), p_category, p_boq_item,
     p_status, coalesce(p_order_date, current_date), p_expected_date, p_notes)
  returning id into new_id;

  perform public.save_purchase_order_items(new_id, p_items);
  return new_id;
end;
$$;

revoke execute on function public.save_purchase_order_items(uuid, jsonb) from anon;
revoke execute on function public.create_purchase_order(uuid, uuid, uuid, text, uuid, text, date, date, text, jsonb) from anon;

-- ─── Paying a PO (runs with the caller's permissions, so RLS applies) ────────

create or replace function public.pay_purchase_order(po_id uuid, paid_on date default current_date)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  po public.purchase_orders%rowtype;
  supplier_name text;
  total numeric(14, 2);
  new_expense uuid;
begin
  select * into po from public.purchase_orders where id = po_id for update;
  if not found then
    raise exception 'Purchase order not found.';
  end if;
  if po.expense_id is not null then
    raise exception 'This PO is already marked paid.';
  end if;
  if po.status not in ('ordered', 'received') then
    raise exception 'Only ordered or received POs can be paid.';
  end if;

  select coalesce(sum(amount), 0) into total from public.purchase_order_items where purchase_order_id = po.id;
  if total <= 0 then
    raise exception 'Add items to the PO before paying it.';
  end if;

  select name into supplier_name from public.suppliers where id = po.supplier_id;

  insert into public.expenses (org_id, project_id, date, category, description, payee, amount, boq_item_id)
  values (po.org_id, po.project_id, coalesce(paid_on, current_date), po.category,
          po.po_number || coalesce(' — ' || nullif(po.notes, ''), ''), supplier_name, total, po.boq_item_id)
  returning id into new_expense;

  update public.purchase_orders set expense_id = new_expense where id = po.id;
  return new_expense;
end;
$$;

-- Undo a payment: removes the cost that paying created. Owners only (it deletes a cost).
create or replace function public.unpay_purchase_order(po_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  po public.purchase_orders%rowtype;
begin
  select * into po from public.purchase_orders where id = po_id for update;
  if not found or po.expense_id is null then
    raise exception 'This PO is not marked paid.';
  end if;
  if not public.is_org_owner(po.org_id) then
    raise exception 'Only an owner can undo a payment.';
  end if;
  delete from public.expenses where id = po.expense_id;  -- sets purchase_orders.expense_id to null
end;
$$;

revoke execute on function public.pay_purchase_order(uuid, date) from anon;
revoke execute on function public.unpay_purchase_order(uuid) from anon;

-- ─── Reporting views (recreated to include the new columns) ──────────────────

drop view public.project_summary;
drop view public.billing_summary;

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

create view public.purchase_order_summary with (security_invoker = true) as
select
  po.*,
  s.name as supplier_name,
  coalesce(i.total, 0)::numeric(14, 2) as total,
  coalesce(i.item_count, 0)::integer as item_count,
  e.date as paid_date
from public.purchase_orders po
join public.suppliers s on s.id = po.supplier_id
left join (
  select purchase_order_id, sum(amount) as total, count(*) as item_count
  from public.purchase_order_items group by purchase_order_id
) i on i.purchase_order_id = po.id
left join public.expenses e on e.id = po.expense_id;

create view public.project_summary with (security_invoker = true) as
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
  coalesce(po.payable, 0)::numeric(14, 2) as payable
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
         sum(case when kind = 'progress' then gross_amount else 0 end) as progress_gross,
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
) po on po.project_id = pr.id;
