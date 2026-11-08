-- Local development seed data. Runs only against the local Supabase (`npx supabase db reset`).
-- Demo login:  demo@constructai.test  /  demo-password-2026

do $$
declare
  uid uuid := '11111111-1111-4111-8111-111111111111';
  org uuid;
  p_santos uuid := gen_random_uuid();
  p_reyes uuid := gen_random_uuid();
  p_lim uuid := gen_random_uuid();
  p_bayan uuid := gen_random_uuid();
  b uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'demo@constructai.test', crypt('demo-password-2026', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Engr. Juan Dela Cruz","company_name":"Dela Cruz Builders"}',
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  values (gen_random_uuid(), uid, uid::text,
          jsonb_build_object('sub', uid::text, 'email', 'demo@constructai.test', 'email_verified', true),
          'email', now(), now(), now());

  select org_id into org from public.organization_members where user_id = uid;

  -- Projects
  insert into public.projects (id, org_id, name, client_name, location, status, contract_amount, budget, start_date, end_date) values
    (p_santos, org, 'Santos Residence', 'Maria Santos', 'BGC, Taguig', 'active', 4250000, 3650000, current_date - 120, current_date + 90),
    (p_reyes, org, 'Reyes Commercial Building', 'Roberto Reyes', 'Quezon City', 'active', 12800000, 11400000, current_date - 300, current_date + 25),
    (p_lim, org, 'Lim Townhouse', 'Daphne Lim', 'Parañaque', 'completed', 8400000, 7200000, current_date - 420, current_date - 40),
    (p_bayan, org, 'Barangay Multi-Purpose Hall', 'LGU San Pedro', 'San Pedro, Laguna', 'bidding', 6100000, 5300000, null, null);

  -- Change orders
  insert into public.change_orders (org_id, project_id, description, amount, status, date) values
    (org, p_santos, 'Perimeter fence (CHB)', 85000, 'approved', current_date - 60),
    (org, p_santos, 'Upgrade roofing to GA26', 42000, 'pending', current_date - 20),
    (org, p_reyes, 'Additional comfort room, 3F', 210000, 'approved', current_date - 90),
    (org, p_lim, 'Kitchen cabinet upgrade', 120000, 'approved', current_date - 200);

  -- Project expenses
  insert into public.expenses (org_id, project_id, date, category, description, payee, amount) values
    (org, p_santos, current_date - 110, 'materials', 'Cement 400 bags', 'Holcim Dealer Taguig', 114000),
    (org, p_santos, current_date - 95, 'materials', 'Rebar 12mm & 16mm', 'Steel Asia Supplier', 286000),
    (org, p_santos, current_date - 80, 'labor', 'Payroll weeks 1–4', 'Site crew', 248000),
    (org, p_santos, current_date - 50, 'labor', 'Payroll weeks 5–8', 'Site crew', 262000),
    (org, p_santos, current_date - 45, 'equipment', 'Concrete mixer & vibrator rental', 'RentAll PH', 38000),
    (org, p_santos, current_date - 30, 'subcontractor', 'Electrical rough-in', 'Bright Electric Co.', 175000),
    (org, p_santos, current_date - 12, 'materials', 'CHB 6" 3,000 pcs', 'Laguna Hollow Blocks', 57000),
    (org, p_santos, current_date - 5, 'permits', 'Building permit renewal', 'LGU Taguig', 18500),
    (org, p_reyes, current_date - 280, 'materials', 'Structural steel', 'Steel Asia Supplier', 2450000),
    (org, p_reyes, current_date - 200, 'subcontractor', 'MEPF works', 'Prime MEP Corp.', 2900000),
    (org, p_reyes, current_date - 150, 'labor', 'Payroll Q2', 'Site crew', 1850000),
    (org, p_reyes, current_date - 70, 'labor', 'Payroll Q3', 'Site crew', 1720000),
    (org, p_reyes, current_date - 40, 'materials', 'Finishing materials (tiles, paint)', 'Wilcon Depot', 1680000),
    (org, p_reyes, current_date - 15, 'equipment', 'Scaffolding rental', 'RentAll PH', 96000),
    (org, p_lim, current_date - 400, 'materials', 'Structural materials', 'Various suppliers', 2600000),
    (org, p_lim, current_date - 300, 'labor', 'Payroll', 'Site crew', 2350000),
    (org, p_lim, current_date - 150, 'subcontractor', 'Plumbing & electrical', 'Prime MEP Corp.', 1150000),
    (org, p_lim, current_date - 60, 'materials', 'Finishing works', 'Wilcon Depot', 1020000);

  -- Company overhead (not tied to a project)
  insert into public.expenses (org_id, project_id, date, category, description, payee, amount)
  select org, null, (date_trunc('month', current_date) - (n || ' months')::interval + interval '4 days')::date,
         'overhead', 'Office rent & utilities', 'Office landlord', 45000
  from generate_series(0, 11) n;
  insert into public.expenses (org_id, project_id, date, category, description, payee, amount)
  select org, null, (date_trunc('month', current_date) - (n || ' months')::interval + interval '14 days')::date,
         'overhead', 'Office staff salaries', 'Office staff', 120000
  from generate_series(0, 11) n;

  -- Billings & payments: Santos
  insert into public.billings (org_id, project_id, reference, description, amount, billed_date, due_date)
    values (org, p_santos, 'DP-01', 'Down payment (15%)', 637500, current_date - 118, current_date - 104) returning id into b;
  insert into public.payments (org_id, billing_id, date, amount, method, reference) values (org, b, current_date - 110, 637500, 'bank_transfer', 'BDO 88213');
  insert into public.billings (org_id, project_id, reference, description, amount, billed_date, due_date)
    values (org, p_santos, 'PB-01', 'Progress billing #1 — foundation', 850000, current_date - 70, current_date - 55) returning id into b;
  insert into public.payments (org_id, billing_id, date, amount, method, reference) values (org, b, current_date - 58, 850000, 'bank_transfer', 'BPI 55120');
  insert into public.billings (org_id, project_id, reference, description, amount, billed_date, due_date)
    values (org, p_santos, 'PB-02', 'Progress billing #2 — structural frame', 850000, current_date - 25, current_date - 10) returning id into b;
  insert into public.payments (org_id, billing_id, date, amount, method, reference) values (org, b, current_date - 8, 400000, 'gcash', 'GC-77812');

  -- Reyes
  insert into public.billings (org_id, project_id, reference, description, amount, billed_date, due_date)
    values (org, p_reyes, 'DP-01', 'Down payment (20%)', 2560000, current_date - 298, current_date - 285) returning id into b;
  insert into public.payments (org_id, billing_id, date, amount, method) values (org, b, current_date - 290, 2560000, 'check');
  insert into public.billings (org_id, project_id, reference, description, amount, billed_date, due_date)
    values (org, p_reyes, 'PB-01', 'Progress billing #1', 3200000, current_date - 210, current_date - 195) returning id into b;
  insert into public.payments (org_id, billing_id, date, amount, method) values (org, b, current_date - 196, 3200000, 'bank_transfer');
  insert into public.billings (org_id, project_id, reference, description, amount, billed_date, due_date)
    values (org, p_reyes, 'PB-02', 'Progress billing #2', 2800000, current_date - 120, current_date - 105) returning id into b;
  insert into public.payments (org_id, billing_id, date, amount, method) values (org, b, current_date - 100, 2800000, 'bank_transfer');
  insert into public.billings (org_id, project_id, reference, description, amount, billed_date, due_date)
    values (org, p_reyes, 'PB-03', 'Progress billing #3 — finishing', 2100000, current_date - 45, current_date - 30);

  -- Lim (completed, fully paid)
  insert into public.billings (org_id, project_id, reference, description, amount, billed_date, due_date)
    values (org, p_lim, 'DP-01', 'Down payment', 1700000, current_date - 415, current_date - 400) returning id into b;
  insert into public.payments (org_id, billing_id, date, amount, method) values (org, b, current_date - 405, 1700000, 'bank_transfer');
  insert into public.billings (org_id, project_id, reference, description, amount, billed_date, due_date)
    values (org, p_lim, 'PB-01', 'Progress billing #1', 3400000, current_date - 250, current_date - 235) returning id into b;
  insert into public.payments (org_id, billing_id, date, amount, method) values (org, b, current_date - 240, 3400000, 'bank_transfer');
  insert into public.billings (org_id, project_id, reference, description, amount, billed_date, due_date)
    values (org, p_lim, 'FB-01', 'Final billing incl. change order', 3420000, current_date - 45, current_date - 30) returning id into b;
  insert into public.payments (org_id, billing_id, date, amount, method) values (org, b, current_date - 32, 3420000, 'bank_transfer');
end;
$$;
