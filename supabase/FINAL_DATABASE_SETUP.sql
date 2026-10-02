-- PRODUCTION READY SQL SETUP FOR THE SMART WORTH
-- This script sets up all necessary tables, functions, and security for a production environment.

-- 1. TABLES

-- Profiles Table (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    mobile TEXT,
    password TEXT,
    dob DATE,
    gender TEXT,
    state TEXT,
    city TEXT,
    pin_code TEXT,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.profiles(id), -- Standardized to UUID
    package_id TEXT,
    role TEXT DEFAULT 'user',
    wallet_balance DECIMAL(12,2) DEFAULT 0.00,
    total_earned DECIMAL(12,2) DEFAULT 0.00,
    pending_balance DECIMAL(12,2) DEFAULT 0.00,
    approved_balance DECIMAL(12,2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    profile_pic TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packages Table
CREATE TABLE IF NOT EXISTS public.packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    original_price DECIMAL(12,2) DEFAULT 0.00,
    offer_price DECIMAL(12,2) DEFAULT 0.00,
    discount_label TEXT,
    enrolled_count_text TEXT,
    button_text TEXT DEFAULT 'Enroll Now',
    badge_text TEXT DEFAULT 'Best Value',
    thumbnail_url TEXT,
    rating DECIMAL(3,1) DEFAULT 5.0,
    gst DECIMAL(5,2) DEFAULT 0.00,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    courses JSONB DEFAULT '[]'::jsonb,
    books JSONB DEFAULT '[]'::jsonb,
    commission_direct DECIMAL(12,2) DEFAULT 0.00,
    commission_indirect DECIMAL(12,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments Table
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    package_id TEXT REFERENCES public.packages(id),
    status TEXT DEFAULT 'active',
    enrolled_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT CHECK (type IN ('credit', 'debit')),
    category TEXT CHECK (category IN ('referral', 'payout', 'purchase', 'bonus', 'refund')),
    description TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral Tracking Table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES public.profiles(id),
    referred_id UUID REFERENCES public.profiles(id),
    referred_email TEXT,
    package_id TEXT REFERENCES public.packages(id),
    order_id TEXT,
    payment_id TEXT,
    amount DECIMAL(12,2),
    commission_earned DECIMAL(12,2),
    level INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout Requests Table
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    method TEXT,
    details JSONB,
    status TEXT DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id TEXT REFERENCES public.packages(id),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons Table
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT,
    content TEXT,
    order_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral Codes Table
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 10.00,
    earning_percent DECIMAL(5,2) DEFAULT 60.00,
    clicks INTEGER DEFAULT 0,
    enrollments INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Razorpay Orders Table
CREATE TABLE IF NOT EXISTS public.razorpay_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT,
    package_id TEXT REFERENCES public.packages(id),
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'created',
    referral_code TEXT,
    is_pre_signup BOOLEAN DEFAULT false,
    commission_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SECURITY (RLS & HELPER FUNCTIONS)

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR email = 'helplinesmartworth@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_orders ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage own profile." ON public.profiles FOR ALL USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Packages are viewable by everyone." ON public.packages FOR SELECT USING (true);
CREATE POLICY "Admins can manage packages." ON public.packages FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view own transactions." ON public.transactions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can view own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Referral codes are viewable by everyone." ON public.referral_codes FOR SELECT USING (true);
CREATE POLICY "Users can manage own referral codes." ON public.referral_codes FOR ALL USING (auth.uid() = creator_id OR public.is_admin());

-- 3. CORE LOGIC (FUNCTIONS & TRIGGERS)

-- Atomic Wallet Update
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(user_id_val UUID, amount_val DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + amount_val,
      total_earned = COALESCE(total_earned, 0) + amount_val,
      approved_balance = COALESCE(approved_balance, 0) + amount_val
  WHERE id = user_id_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Referral Commission Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    referrer_id_val UUID;
    package_record RECORD;
    commission_val DECIMAL;
    already_referred BOOLEAN;
BEGIN
    -- Only proceed if package_id is set and referred_by is set
    IF NEW.package_id IS NOT NULL AND NEW.referred_by IS NOT NULL THEN
        -- Check if this user has already been credited
        SELECT EXISTS (
            SELECT 1 FROM public.referrals 
            WHERE referred_id = NEW.id OR (referred_email = NEW.email AND package_id = NEW.package_id)
        ) INTO already_referred;
        
        IF NOT COALESCE(already_referred, false) THEN
            referrer_id_val := NEW.referred_by;

            IF referrer_id_val IS NOT NULL AND referrer_id_val != NEW.id THEN
                SELECT * INTO package_record FROM public.packages WHERE id = NEW.package_id LIMIT 1;
                
                IF FOUND THEN
                    commission_val := COALESCE(package_record.commission_direct, 0);
                    IF commission_val = 0 THEN
                        commission_val := ROUND((COALESCE(package_record.offer_price, package_record.price) * 60 / 100), 2);
                    END IF;
                    
                    IF commission_val > 0 THEN
                        PERFORM public.increment_wallet_balance(referrer_id_val, commission_val);
                        
                        INSERT INTO public.transactions (user_id, amount, type, category, description)
                        VALUES (referrer_id_val, commission_val, 'credit', 'referral', 'Referral commission from ' || COALESCE(NEW.full_name, 'New User'));
                        
                        INSERT INTO public.referrals (referrer_id, referred_id, referred_email, package_id, commission_earned, status)
                        VALUES (referrer_id_val, NEW.id, NEW.email, NEW.package_id, commission_val, 'completed');
                        
                        INSERT INTO public.notifications (user_id, title, message, type)
                        VALUES (referrer_id_val, 'New Referral!', 'You earned ₹' || commission_val || ' from ' || COALESCE(NEW.full_name, 'New User'), 'success');

                        UPDATE public.razorpay_orders 
                        SET commission_paid = true 
                        WHERE email = NEW.email AND package_id = NEW.package_id AND status = 'paid';
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
AFTER INSERT OR UPDATE OF package_id, referred_by ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- 4. INITIAL DATA
INSERT INTO public.packages (id, name, price, commission_direct)
VALUES 
('silver', 'Silver Package', 599, 400),
('gold', 'Gold Package', 1199, 800),
('platinum', 'Platinum Package', 2499, 1700)
ON CONFLICT (id) DO NOTHING;
