-- 1. Update Profiles Table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS approved_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_clicks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_enrollments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earned NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS package_id TEXT;

-- 2. Create Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.profiles(id),
    referred_id UUID REFERENCES public.profiles(id),
    package_id TEXT,
    order_id TEXT UNIQUE,
    payment_id TEXT,
    amount NUMERIC NOT NULL,
    commission_earned NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id),
    amount NUMERIC NOT NULL,
    type TEXT CHECK (type IN ('credit', 'debit')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Razorpay Orders Table (if not exists)
CREATE TABLE IF NOT EXISTS public.razorpay_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    package_id TEXT,
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    amount NUMERIC,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'created',
    referral_code TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS Policies (Basic)
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = profile_id);
