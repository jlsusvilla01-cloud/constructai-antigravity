-- Team members, roles and invitations.
--
-- Roles:
--   owner  — everything, plus: manage the team, rename the company, delete records.
--   member — "Staff": can view everything and add / edit records, but cannot delete
--            anything or manage the team.
--
-- Invitations are links (no email needed): an owner creates one for an email
-- address and sends the link by Viber / Messenger / SMS. The person signs up (or
-- logs in) with that same email and joins the company.

-- ─── Helpers ─────────────────────────────────────────────────────────────────

create or replace function public.is_org_owner(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where org_id = target_org and user_id = auth.uid() and role = 'owner'
  );
$$;

-- ─── Membership management ───────────────────────────────────────────────────

create policy "owners change roles" on public.organization_members
  for update using (public.is_org_owner(org_id)) with check (public.is_org_owner(org_id));

create policy "owners remove members, members leave" on public.organization_members
  for delete using (public.is_org_owner(org_id) or user_id = auth.uid());

-- A company must always keep at least one owner.
create or replace function public.keep_an_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role <> 'owner' or (tg_op = 'UPDATE' and new.role = 'owner') then
    return coalesce(new, old);
  end if;
  -- Allow cascades when the whole company or the user account is being deleted.
  if not exists (select 1 from public.organizations where id = old.org_id)
     or not exists (select 1 from auth.users where id = old.user_id) then
    return coalesce(new, old);
  end if;
  if not exists (
    select 1 from public.organization_members
    where org_id = old.org_id and role = 'owner' and user_id <> old.user_id
  ) then
    raise exception 'A company needs at least one owner. Make someone else an owner first.';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger organization_members_keep_owner
  before update or delete on public.organization_members
  for each row execute function public.keep_an_owner();

-- Team list with names and emails (auth.users is not readable by clients).
create or replace function public.org_members(target_org uuid)
returns table (user_id uuid, email text, full_name text, role text, joined_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, u.email::text, (u.raw_user_meta_data->>'full_name')::text, m.role, m.created_at
  from public.organization_members m
  join auth.users u on u.id = m.user_id
  where m.org_id = target_org and public.is_org_member(target_org)
  order by m.created_at;
$$;

-- ─── Invitations ─────────────────────────────────────────────────────────────

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (email = lower(email) and email like '%_@_%'),
  role text not null default 'member' check (role in ('owner', 'member')),
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null
);

create unique index invitations_open_email_idx on public.invitations(org_id, email) where accepted_at is null;

alter table public.invitations enable row level security;

create policy "owners manage invitations" on public.invitations
  for all using (public.is_org_owner(org_id)) with check (public.is_org_owner(org_id));

-- What the invite page shows before the person has an account.
create or replace function public.invitation_preview(invite_token uuid)
returns table (org_name text, email text, role text, accepted boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select o.name, i.email, i.role, i.accepted_at is not null
  from public.invitations i
  join public.organizations o on o.id = i.org_id
  where i.token = invite_token;
$$;

grant execute on function public.invitation_preview(uuid) to anon, authenticated;

-- A signed-in user accepts an invitation addressed to their email. Returns the company id.
create or replace function public.accept_invitation(invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.invitations%rowtype;
  my_email text;
begin
  if auth.uid() is null then
    raise exception 'Log in first.';
  end if;

  select * into inv from public.invitations where token = invite_token for update;
  if not found or inv.accepted_at is not null then
    raise exception 'This invitation link is no longer valid.';
  end if;

  select lower(email) into my_email from auth.users where id = auth.uid();
  if my_email is distinct from inv.email then
    raise exception 'This invitation is for %. Log in with that email to accept it.', inv.email;
  end if;

  insert into public.organization_members (org_id, user_id, role)
  values (inv.org_id, auth.uid(), inv.role)
  on conflict (org_id, user_id) do nothing;

  update public.invitations set accepted_at = now(), accepted_by = auth.uid() where id = inv.id;
  return inv.org_id;
end;
$$;

revoke execute on function public.accept_invitation(uuid) from anon;

-- Signup: when the person signs up from an invitation link (invite_token in the
-- user metadata, matching their email), they join that company instead of
-- getting a new one.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_org uuid;
  raw_token text := new.raw_user_meta_data->>'invite_token';
  inv public.invitations%rowtype;
begin
  if raw_token ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select * into inv from public.invitations
    where token = raw_token::uuid and accepted_at is null and email = lower(new.email)
    for update;

    if found then
      insert into public.organization_members (org_id, user_id, role)
      values (inv.org_id, new.id, inv.role);
      update public.invitations set accepted_at = now(), accepted_by = new.id where id = inv.id;
      return new;
    end if;
  end if;

  insert into public.organizations (name)
  values (coalesce(nullif(trim(new.raw_user_meta_data->>'company_name'), ''), 'My Company'))
  returning id into new_org;

  insert into public.organization_members (org_id, user_id, role)
  values (new_org, new.id, 'owner');

  return new;
end;
$$;

-- ─── Only owners delete records ──────────────────────────────────────────────
-- Replace the "members manage …" (for all) policies with separate read / add /
-- edit policies for every member, and delete for owners only.

do $$
declare
  t text;
begin
  foreach t in array array['projects', 'change_orders', 'expenses', 'billings', 'payments'] loop
    execute format('drop policy if exists %I on public.%I', 'members manage ' || replace(t, '_', ' '), t);
    execute format('create policy "members read" on public.%I for select using (public.is_org_member(org_id))', t);
    execute format('create policy "members add" on public.%I for insert with check (public.is_org_member(org_id))', t);
    execute format(
      'create policy "members edit" on public.%I for update using (public.is_org_member(org_id)) with check (public.is_org_member(org_id))', t);
    execute format('create policy "owners delete" on public.%I for delete using (public.is_org_owner(org_id))', t);
  end loop;
end;
$$;
