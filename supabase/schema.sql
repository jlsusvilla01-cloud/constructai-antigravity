-- ConstructAI PH — Supabase Schema
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  full_name text,
  company text,
  role text default 'contractor',
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references profiles(id),
  name text not null,
  client_name text,
  location text,
  contract_amount numeric default 0,
  spent numeric default 0,
  billed numeric default 0,
  received numeric default 0,
  progress int default 0,
  phase text default 'Pre-Construction',
  cash_gap numeric default 0,
  open_punch int default 0,
  margin numeric default 0,
  days_left int default 0,
  health text default 'good',
  created_at timestamptz default now()
);

create table if not exists punches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  area text,
  item text,
  trade text,
  priority text default 'Med',
  status text default 'Open',
  due text,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  sender text not null,
  text text not null,
  created_at timestamptz default now()
);

create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  mat text not null,
  delivered numeric default 0,
  used numeric default 0,
  expected numeric default 0,
  cost numeric default 0,
  reorder numeric default 0
);

create table if not exists change_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  description text,
  requested_by text,
  amount numeric default 0,
  status text default 'Pending',
  date date default current_date
);

create table if not exists billings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  ref text,
  milestone text,
  amount numeric default 0,
  due_date date,
  status text default 'Not Due',
  paymongo_link_id text,
  paymongo_checkout_url text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists feature_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text default 'General',
  votes int default 1,
  status text default 'In Review',
  submitted_by text,
  email text,
  description text,
  created_at timestamptz default now()
);

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int default 0
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  company text,
  location text,
  rating int default 5,
  text text,
  avatar text
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table projects enable row level security;
alter table punches enable row level security;
alter table messages enable row level security;
alter table inventory enable row level security;
alter table change_orders enable row level security;
alter table billings enable row level security;
alter table feature_requests enable row level security;
alter table faqs enable row level security;
alter table testimonials enable row level security;

create policy "own_profile" on profiles for all using (auth.uid() = id);

create policy "own_projects" on projects for all
  using (contractor_id = auth.uid());

create policy "project_punches" on punches for all
  using (project_id in (select id from projects where contractor_id = auth.uid()));

create policy "project_messages" on messages for all
  using (project_id in (select id from projects where contractor_id = auth.uid()));

create policy "project_inventory" on inventory for all
  using (project_id in (select id from projects where contractor_id = auth.uid()));

create policy "project_cos" on change_orders for all
  using (project_id in (select id from projects where contractor_id = auth.uid()));

create policy "project_billings" on billings for all
  using (project_id in (select id from projects where contractor_id = auth.uid()));

create policy "read_frs" on feature_requests for select using (true);
create policy "insert_frs" on feature_requests for insert with check (auth.uid() is not null);

create policy "read_faqs" on faqs for select using (true);
create policy "read_testimonials" on testimonials for select using (true);

-- ─── Auto-create profile on signup ───────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Seed Data ────────────────────────────────────────────────────────────────
-- Run AFTER signing up with contractor@constructai.ph / demo123
-- Replace YOUR_CONTRACTOR_UUID with your actual user UUID from Auth → Users

do $$
declare
  uid uuid := (select id from auth.users where email = 'contractor@constructai.ph' limit 1);
  p1 uuid; p2 uuid; p3 uuid;
begin
  if uid is null then
    raise notice 'No user found with email contractor@constructai.ph — skipping seed';
    return;
  end if;

  -- Projects
  insert into projects (id, contractor_id, name, client_name, location, contract_amount, spent, billed, received, progress, phase, cash_gap, open_punch, margin, days_left, health)
  values
    (gen_random_uuid(), uid, 'Santos Residence', 'Maria Santos', 'BGC, Taguig', 4250000, 1240000, 980000, 750000, 42, 'Structural Works', 230000, 4, 13.4, 89, 'good'),
    (gen_random_uuid(), uid, 'Reyes Commercial Bldg', 'Roberto Reyes', 'Quezon City', 12800000, 7680000, 10240000, 9260000, 78, 'Finishing Works', 980000, 12, 8.2, 22, 'watch'),
    (gen_random_uuid(), uid, 'Lim Townhouse', 'Daphne Lim', 'Parañaque', 8400000, 8400000, 8400000, 8400000, 100, 'Warranty Period', 0, 0, 14.8, 0, 'good')
  returning id into p1;

  -- Get first project ID for demo data
  select id into p1 from projects where contractor_id = uid and name = 'Santos Residence' limit 1;

  -- Punches for project 1
  insert into punches (project_id, area, item, trade, priority, status, due)
  values
    (p1, 'Kitchen', 'Grout missing on floor tiles (3 spots)', 'Tiles', 'High', 'Open', 'Apr 22'),
    (p1, 'Master BR', 'Paint peeling at ceiling cornice', 'Painter', 'Med', 'Open', 'Apr 25'),
    (p1, 'CR 1', 'Exhaust fan not working', 'Electrical', 'High', 'Resolved', 'Apr 20'),
    (p1, 'Staircase', 'Baluster 3 wobbly — regrout needed', 'Masonry', 'High', 'Open', 'Apr 22');

  -- Messages for project 1
  insert into messages (project_id, sender, text, created_at)
  values
    (p1, 'contractor', 'Column rebar works Level 1 complete. On track for Apr 18 slab pour.', now() - interval '5 days'),
    (p1, 'client', 'Looks great in the photos!', now() - interval '5 days' + interval '1 hour'),
    (p1, 'contractor', 'Still on schedule. I will notify you 3 days before the slab pour.', now() - interval '5 days' + interval '2 hours');

  -- Inventory for project 1
  insert into inventory (project_id, mat, delivered, used, expected, cost, reorder)
  values
    (p1, 'Cement (bags)', 820, 640, 180, 285, 50),
    (p1, 'Rebar 12mm (pcs)', 480, 390, 90, 408, 20),
    (p1, 'CHB 6" (pcs)', 1500, 1100, 400, 18, 200),
    (p1, 'Sand (m³)', 42, 35, 7, 520, 5),
    (p1, 'Gravel (m³)', 38, 32, 6, 680, 5),
    (p1, 'Plywood sheets', 80, 72, 8, 1450, 10),
    (p1, 'GI Wire (kg)', 120, 98, 22, 85, 20),
    (p1, 'Paint 4L (cans)', 24, 8, 16, 680, 0);

  -- Billings for project 1
  insert into billings (project_id, ref, milestone, amount, due_date, status)
  values
    (p1, 'DP-01', 'Down Payment (10%)', 425000, '2025-02-01', 'Received'),
    (p1, 'PR-01', 'Foundation Complete (20%)', 850000, '2025-02-20', 'Received'),
    (p1, 'PR-02', 'Structural Framing (20%)', 850000, '2025-03-15', 'Partial'),
    (p1, 'PR-03', 'Roofing & MEP (20%)', 850000, '2025-04-10', 'Not Due'),
    (p1, 'FN-01', 'Final Turnover (10%)', 425000, '2025-06-01', 'Not Due');

  -- Change orders for project 1
  insert into change_orders (project_id, description, requested_by, amount, status, date)
  values
    (p1, 'Perimeter fence (CHB)', 'Client', 85000, 'Approved', '2025-03-03'),
    (p1, 'Upgrade roofing to GA26', 'Client', 42000, 'Pending', '2025-03-10'),
    (p1, 'Relocate kitchen drain', 'Architect', 18500, 'Disputed', '2025-03-14');

  raise notice 'Seed completed for uid %', uid;
end;
$$;

-- Seed public data (FAQs, testimonials, feature requests)
insert into faqs (question, answer, sort_order) values
  ('How does the client portal work?', 'Clients get a unique secure link to see real-time progress, photos, and milestones. No app download needed.', 1),
  ('Can I manage multiple projects?', 'Yes. Pro supports 10 active projects, Enterprise is unlimited. Each has its own dashboard, portal, and billing tracker.', 2),
  ('Can I cancel anytime?', 'Monthly billing — cancel anytime, no penalties. Annual gives 2 months free. 14-day trial, no credit card required.', 3)
on conflict do nothing;

insert into testimonials (name, role, company, location, rating, text, avatar) values
  ('Engr. Ramon dela Cruz', 'General Contractor', 'RDC Construction Corp', 'Quezon City', 5, 'Before ConstructAI, clients called me 3x a day. Now they check their portal. Disputes dropped to zero.', 'RC'),
  ('Arch. Maria Santos', 'Design-Build Contractor', 'Santos Design Build', 'BGC, Taguig', 5, 'The change order module paid for the subscription in month 1. We recovered ₱340,000 we would have lost.', 'MS'),
  ('Engr. Jose Reyes', 'Civil Works', 'Reyes Civil Works', 'Cebu City', 5, 'The weather delay tracker helped me claim 12 extra days on a government project. Client accepted immediately.', 'JR'),
  ('Daphne Lim', 'Property Developer', 'Lim Properties', 'Makati', 5, 'I oversee 6 projects at once. ConstructAI shows me which need attention. My accountant loves the billing tracker.', 'DL')
on conflict do nothing;

insert into feature_requests (title, category, votes, status, submitted_by, description) values
  ('Offline mode for daily reports', 'Mobile', 47, 'In Review', 'Engr. dela Cruz', 'File reports on site even without internet. Sync automatically when back online.'),
  ('QR code attendance scanning', 'Workforce', 38, 'Planned', 'Arch. Santos', 'Workers scan QR code at gate to record time-in/out. Eliminates ghost workers automatically.'),
  ('GCash direct payment in client portal', 'Payments', 31, 'In Review', 'Daphne Lim', 'Allow clients to pay progress billings directly in their portal via GCash or Maya.'),
  ('Export BOQ to Excel', 'BOQ', 25, 'Completed', 'Engr. Reyes', 'One-click export of full BOQ to Excel for client submission and archiving.')
on conflict do nothing;
