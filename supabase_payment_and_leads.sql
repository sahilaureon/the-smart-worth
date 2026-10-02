-- =========================================================================
-- The Smart Worth - Payment Gateway, Unknown Users & Payment Helper Tables
-- =========================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor -> Run
-- This script is non-destructive (safe to run multiple times).

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. SITE SETTINGS TABLE (Fast key-value cache for gateway & settings)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read site_settings" ON public.site_settings;
CREATE POLICY "Allow public read site_settings" ON public.site_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role full access site_settings" ON public.site_settings;
CREATE POLICY "Allow service role full access site_settings" ON public.site_settings
    FOR ALL USING (true) WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 2. UNKNOWN USERS TABLE (Home / Registration / Checkout Leads)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.unknown_users (
    id TEXT PRIMARY KEY,
    full_name TEXT,
    username TEXT,
    email TEXT,
    mobile TEXT,
    dob DATE,
    gender TEXT,
    state TEXT,
    city TEXT,
    pin_code TEXT,
    package_id TEXT DEFAULT 'silver',
    package_name TEXT DEFAULT 'VIP Learning Package',
    amount NUMERIC(10, 2) DEFAULT 599.00,
    original_price NUMERIC(10, 2) DEFAULT 999.00,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    referral_code TEXT,
    order_id TEXT,
    source TEXT DEFAULT 'home_registration',
    status TEXT DEFAULT 'pending_payment', -- pending_payment, converted, abandoned, ticket_raised
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes for Unknown Users
CREATE INDEX IF NOT EXISTS idx_unknown_users_email ON public.unknown_users(email);
CREATE INDEX IF NOT EXISTS idx_unknown_users_mobile ON public.unknown_users(mobile);
CREATE INDEX IF NOT EXISTS idx_unknown_users_status ON public.unknown_users(status);
CREATE INDEX IF NOT EXISTS idx_unknown_users_order_id ON public.unknown_users(order_id);
CREATE INDEX IF NOT EXISTS idx_unknown_users_created_at ON public.unknown_users(created_at DESC);

ALTER TABLE public.unknown_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert unknown_users" ON public.unknown_users;
CREATE POLICY "Allow anon insert unknown_users" ON public.unknown_users
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update unknown_users" ON public.unknown_users;
CREATE POLICY "Allow anon update unknown_users" ON public.unknown_users
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select unknown_users" ON public.unknown_users;
CREATE POLICY "Allow select unknown_users" ON public.unknown_users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins full manage unknown_users" ON public.unknown_users;
CREATE POLICY "Admins full manage unknown_users" ON public.unknown_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN' OR role = 'owner')
        )
    );

-- -------------------------------------------------------------------------
-- 3. PAYMENT HELPER TICKETS TABLE (User Raised Issues & Proofs)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_helper_tickets (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    email TEXT NOT NULL,
    full_name TEXT,
    mobile TEXT,
    city TEXT,
    state TEXT,
    pin_code TEXT,
    package_id TEXT DEFAULT 'silver',
    package_name TEXT DEFAULT 'VIP Learning Package',
    amount NUMERIC(10, 2) DEFAULT 599.00,
    utr_number TEXT NOT NULL,
    screenshot_url TEXT,
    issue_description TEXT DEFAULT 'Payment completed in UPI app but waiting for enrollment activation.',
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    admin_notes TEXT,
    created_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes for Payment Helper Tickets
CREATE INDEX IF NOT EXISTS idx_payment_tickets_utr ON public.payment_helper_tickets(utr_number);
CREATE INDEX IF NOT EXISTS idx_payment_tickets_order_id ON public.payment_helper_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_tickets_email ON public.payment_helper_tickets(email);
CREATE INDEX IF NOT EXISTS idx_payment_tickets_status ON public.payment_helper_tickets(status);
CREATE INDEX IF NOT EXISTS idx_payment_tickets_created_at ON public.payment_helper_tickets(created_at DESC);

ALTER TABLE public.payment_helper_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert payment_helper_tickets" ON public.payment_helper_tickets;
CREATE POLICY "Allow anon insert payment_helper_tickets" ON public.payment_helper_tickets
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read payment_helper_tickets" ON public.payment_helper_tickets;
CREATE POLICY "Allow read payment_helper_tickets" ON public.payment_helper_tickets
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins full manage payment_helper_tickets" ON public.payment_helper_tickets;
CREATE POLICY "Admins full manage payment_helper_tickets" ON public.payment_helper_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN' OR role = 'owner')
        )
    );

-- -------------------------------------------------------------------------
-- 4. STORAGE BUCKET FOR PAYMENT SCREENSHOT PROOFS
-- -------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_proofs', 'payment_proofs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can upload payment proofs" ON storage.objects;
CREATE POLICY "Public can upload payment proofs" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'payment_proofs');

DROP POLICY IF EXISTS "Public can view payment proofs" ON storage.objects;
CREATE POLICY "Public can view payment proofs" ON storage.objects
    FOR SELECT USING (bucket_id = 'payment_proofs');

-- -------------------------------------------------------------------------
-- 5. GRANTS FOR SERVICE ROLE & AUTHENTICATED
-- -------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO postgres, service_role, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
