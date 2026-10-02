-- Migration: Fix and Setup Razorpay Orders, Referrals, and Wallet Tables
-- Date: 2024-04-03

-- 1. Create razorpay_orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.razorpay_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    package_id TEXT NOT NULL,
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'created', -- 'created', 'paid', 'failed'
    referral_code TEXT,
    is_pre_signup BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create referral_codes table for custom discounts
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 20.00, -- 1% to 20%
    earning_percent NUMERIC(5, 2) DEFAULT 50.00, -- Total 70% split
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create referrals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    package_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    payment_id TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    commission_earned NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create wallet_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL, -- 'credit', 'debit'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.razorpay_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies (Using DO block to prevent "already exists" errors)
DO $$ 
BEGIN 
    -- Razorpay Orders
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own orders') THEN
        CREATE POLICY "Users can view own orders" ON public.razorpay_orders FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Referral Codes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own referral codes') THEN
        CREATE POLICY "Users can manage own referral codes" ON public.referral_codes FOR ALL USING (auth.uid() = creator_id);
    END IF;

    -- Referrals
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Referrers can view own referrals') THEN
        CREATE POLICY "Referrers can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
    END IF;

    -- Wallet Transactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own transactions') THEN
        CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = profile_id);
    END IF;
END $$;

-- 7. Add updated_at trigger for razorpay_orders
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_razorpay_orders_updated_at ON public.razorpay_orders;
CREATE TRIGGER update_razorpay_orders_updated_at
    BEFORE UPDATE ON public.razorpay_orders
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 8. Ensure profiles table has wallet_balance
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='wallet_balance') THEN
        ALTER TABLE public.profiles ADD COLUMN wallet_balance NUMERIC(10, 2) DEFAULT 0;
    END IF;
END $$;
