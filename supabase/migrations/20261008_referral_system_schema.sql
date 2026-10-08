-- =========================================================================
-- THE SMART WORTH — REFERRAL SYSTEM & COMMISSION CALCULATOR SCHEMA
-- Fixed 30% Company Share | 51%-70% Referrer Earning | Dynamic Package Pricing
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- =========================================================================

-- 1. Create or update referral_codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    company_percent NUMERIC NOT NULL DEFAULT 30 CHECK (company_percent = 30),
    earning_percent NUMERIC NOT NULL DEFAULT 60 CHECK (earning_percent >= 51 AND earning_percent <= 70),
    discount_percent NUMERIC NOT NULL DEFAULT 10 CHECK (discount_percent = 70 - earning_percent),
    is_active BOOLEAN DEFAULT TRUE,
    clicks INTEGER DEFAULT 0,
    enrollments INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    total_earnings NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe idempotent column additions in case public.referral_codes already exists:
ALTER TABLE public.referral_codes 
    ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS company_percent NUMERIC NOT NULL DEFAULT 30,
    ADD COLUMN IF NOT EXISTS earning_percent NUMERIC NOT NULL DEFAULT 60,
    ADD COLUMN IF NOT EXISTS discount_percent NUMERIC NOT NULL DEFAULT 10,
    ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS enrollments INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_earnings NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Create or update referrals conversion records table (Stores exact financial snapshots)
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id),
    referred_id UUID REFERENCES auth.users(id),
    referred_user_id UUID,
    referred_email TEXT,
    referral_code TEXT,
    package_id TEXT REFERENCES public.packages(id),
    package_name TEXT,
    order_id TEXT,
    payment_id TEXT,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,             -- Original package price at purchase
    company_percent NUMERIC NOT NULL DEFAULT 30,             -- Fixed 30% company share
    rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 60.00,       -- Referrer earning % (51-70)
    customer_discount_percent NUMERIC NOT NULL DEFAULT 10.00,-- 70 - earning_percent
    customer_discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    customer_payable_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    company_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,     -- 30% company amount
    commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,  -- Referrer commission amount
    commission_earned DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe idempotent column additions in case public.referrals already exists:
ALTER TABLE public.referrals 
    ADD COLUMN IF NOT EXISTS referred_user_id UUID,
    ADD COLUMN IF NOT EXISTS referred_email TEXT,
    ADD COLUMN IF NOT EXISTS referral_code TEXT,
    ADD COLUMN IF NOT EXISTS package_name TEXT,
    ADD COLUMN IF NOT EXISTS company_percent NUMERIC DEFAULT 30,
    ADD COLUMN IF NOT EXISTS rate_percent DECIMAL(5, 2) DEFAULT 60.00,
    ADD COLUMN IF NOT EXISTS customer_discount_percent NUMERIC DEFAULT 10.00,
    ADD COLUMN IF NOT EXISTS customer_discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS customer_payable_amount DECIMAL(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS company_amount DECIMAL(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2) DEFAULT 0.00;

-- 3. Duplicate Commission Protection: Unique indexes on verified transaction references
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_order_id ON public.referrals (order_id) WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_payment_id ON public.referrals (payment_id) WHERE payment_id IS NOT NULL;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 5. Referral Codes RLS Policies
DROP POLICY IF EXISTS "Public can view active referral codes" ON public.referral_codes;
CREATE POLICY "Public can view active referral codes"
    ON public.referral_codes FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Users can view own referral codes" ON public.referral_codes;
CREATE POLICY "Users can view own referral codes"
    ON public.referral_codes FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can create own referral code" ON public.referral_codes;
CREATE POLICY "Users can create own referral code"
    ON public.referral_codes FOR INSERT
    WITH CHECK (
        (auth.uid() = user_id OR auth.uid() = creator_id)
        AND company_percent = 30
        AND earning_percent >= 51
        AND earning_percent <= 70
        AND discount_percent = 70 - earning_percent
    );

DROP POLICY IF EXISTS "Users can update own referral code rate" ON public.referral_codes;
CREATE POLICY "Users can update own referral code rate"
    ON public.referral_codes FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = creator_id)
    WITH CHECK (
        company_percent = 30
        AND earning_percent >= 51
        AND earning_percent <= 70
        AND discount_percent = 70 - earning_percent
    );

-- 6. Referrals RLS Policies
DROP POLICY IF EXISTS "Referrers can view their referral conversions" ON public.referrals;
CREATE POLICY "Referrers can view their referral conversions"
    ON public.referrals FOR SELECT
    USING (auth.uid() = referrer_id);

-- 7. Verification Query for Admin
SELECT 
    r.code,
    r.earning_percent AS referrer_earning,
    r.discount_percent AS customer_discount,
    r.company_percent AS company_share,
    r.enrollments,
    r.total_earnings
FROM public.referral_codes r
ORDER BY r.enrollments DESC;
