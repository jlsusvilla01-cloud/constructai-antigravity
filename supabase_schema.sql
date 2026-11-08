-- 🚀 ConstructAI ERP — Supabase Security & Schema Setup
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Enable RLS on all tables
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gl_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscription_events ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS Policies (auth.uid() = user_id)
-- Leads
CREATE POLICY "Users can only access their own leads" ON leads
  FOR ALL USING (auth.uid() = user_id);

-- Projects
CREATE POLICY "Users can only access their own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Inventory
CREATE POLICY "Users can only access their own inventory" ON inventory
  FOR ALL USING (auth.uid() = user_id);

-- Invoices
CREATE POLICY "Users can only access their own invoices" ON invoices
  FOR ALL USING (auth.uid() = user_id);

-- GL Entries
CREATE POLICY "Users can only access their own financial records" ON gl_entries
  FOR ALL USING (auth.uid() = user_id);

-- Attendance
CREATE POLICY "Users can only access their own attendance logs" ON attendance
  FOR ALL USING (auth.uid() = user_id);

-- Subscription Events
CREATE POLICY "Users can only see their own subscription events" ON subscription_events
  FOR ALL USING (auth.uid() = user_id);

-- 3. Enable Real-time for active tables
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE gl_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;

-- 4. Sample Table Definitions (in case they don't exist yet)
-- NOTE: If your tables are already created, these will skip.
CREATE TABLE IF NOT EXISTS public.leads (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  location TEXT,
  value NUMERIC,
  contact TEXT,
  stage TEXT DEFAULT 'Inquiry',
  health TEXT DEFAULT 'hot'
);

CREATE TABLE IF NOT EXISTS public.projects (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  location TEXT,
  budget NUMERIC,
  progress INT DEFAULT 0,
  status TEXT DEFAULT 'Planning'
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  project_id BIGINT,
  worker_id INT,
  worker_name TEXT,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  scan_method TEXT DEFAULT 'QR',
  status TEXT DEFAULT 'Present'
);

CREATE TABLE IF NOT EXISTS public.gl_entries (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  project_id BIGINT,
  account_code TEXT,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  reference TEXT,
  type TEXT,
  entry_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Auto-set user_id on insert (Optimization)
-- This ensures that even if the frontend forgets to send user_id, it is set correctly.
CREATE OR REPLACE FUNCTION public.handle_set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to all tables
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('leads','projects','inventory','invoices','gl_entries','attendance')
  LOOP
    EXECUTE 'CREATE TRIGGER set_user_id_trigger BEFORE INSERT ON ' || t || ' FOR EACH ROW EXECUTE FUNCTION handle_set_user_id();';
  END LOOP;
END;
$$;

-- 5. Subscription & Profile Management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  plan_type TEXT DEFAULT 'Trial',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  trial_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days')
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can only update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup and create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, plan_type)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'Trial');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
