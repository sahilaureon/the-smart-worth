-- The Smart Worth - Database Schema
-- Non-destructive schema definition using CREATE TABLE IF NOT EXISTS

-- 1. Profiles Table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    username TEXT UNIQUE,
    email TEXT,
    mobile TEXT,
    dob DATE,
    gender TEXT,
    state TEXT,
    city TEXT,
    pin_code TEXT,
    profile_pic TEXT,
    wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
    total_earned DECIMAL(12, 2) DEFAULT 0.00,
    approved_balance DECIMAL(12, 2) DEFAULT 0.00,
    referral_code TEXT UNIQUE,
    tsw_id TEXT UNIQUE DEFAULT 'TSW' || floor(random() * (999999-100000+1) + 100000)::text,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    ban_until TIMESTAMPTZ,
    referred_by UUID REFERENCES auth.users(id),
    package_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles." ON public.profiles;
CREATE POLICY "Admins can manage all profiles." ON public.profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')));

-- 2. Packages Table
CREATE TABLE IF NOT EXISTS public.packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    original_price DECIMAL(10, 2) DEFAULT 0.00,
    offer_price DECIMAL(10, 2) DEFAULT 0.00,
    discount_label TEXT,
    enrolled_count_text TEXT,
    button_text TEXT DEFAULT 'Enroll Now',
    badge_text TEXT DEFAULT 'Best Value',
    thumbnail_url TEXT,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    gst DECIMAL(10, 2) DEFAULT 0.00,
    features JSONB DEFAULT '[]',
    courses JSONB DEFAULT '[]',
    books JSONB DEFAULT '[]',
    revenue DECIMAL(12, 2) DEFAULT 0.00,
    users INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Packages
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Packages are viewable by everyone." ON public.packages;
CREATE POLICY "Packages are viewable by everyone." ON public.packages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage packages." ON public.packages;
CREATE POLICY "Admins can manage packages." ON public.packages FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')));

-- 2.1 Lesson Completions Table
CREATE TABLE IF NOT EXISTS public.lesson_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id, lesson_id)
);

-- Enable RLS for Lesson Completions
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own completions." ON public.lesson_completions;
CREATE POLICY "Users can manage own completions." ON public.lesson_completions FOR ALL USING (auth.uid() = user_id);

-- 3. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    digit_lesson TEXT,
    lessons JSONB DEFAULT '[]',
    show_on_home BOOLEAN DEFAULT FALSE,
    package_id TEXT REFERENCES public.packages(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Courses are viewable by everyone." ON public.courses;
-- Admins can view all courses, users can view only if enrolled in a package that contains the course
CREATE POLICY "Users can only view courses they have access to via packages" 
ON public.courses 
FOR SELECT 
USING (
  -- Admins see everything
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')))
  OR 
  -- Users see courses that are in their enrolled packages
  (EXISTS (
    SELECT 1 
    FROM public.enrollments e
    JOIN public.packages p ON e.package_id = p.id
    WHERE e.user_id = auth.uid() 
      AND (e.status = 'active' OR e.status IS NULL)
      AND p.courses @> jsonb_build_array(public.courses.id::text)
  ))
);

DROP POLICY IF EXISTS "Admins can manage courses." ON public.courses;
CREATE POLICY "Admins can manage courses." ON public.courses FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')));

-- 3.1 Course Progress Table
CREATE TABLE IF NOT EXISTS public.user_course_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    last_lesson_index INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own course progress." ON public.user_course_progress;
CREATE POLICY "Users can manage own course progress." ON public.user_course_progress FOR ALL USING (auth.uid() = user_id);

-- 4. Razorpay Orders Table
CREATE TABLE IF NOT EXISTS public.razorpay_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    email TEXT,
    package_id TEXT REFERENCES public.packages(id),
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'created',
    referral_code TEXT,
    is_pre_signup BOOLEAN DEFAULT FALSE,
    commission_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Purchases Table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    package_id TEXT REFERENCES public.packages(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_id TEXT,
    order_id TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enrollments Table
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    package_id TEXT REFERENCES public.packages(id),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, package_id)
);

-- Enable RLS for Enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own enrollments." ON public.enrollments;
CREATE POLICY "Users can view own enrollments." ON public.enrollments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all enrollments." ON public.enrollments;
CREATE POLICY "Admins can view all enrollments." ON public.enrollments FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')));

-- 7. Referral Codes Table
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    discount_percent NUMERIC DEFAULT 10,
    earning_percent NUMERIC DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    clicks INTEGER DEFAULT 0,
    enrollments INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    total_earnings NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for referral_codes
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active referral codes" ON public.referral_codes;
CREATE POLICY "Public can view active referral codes" ON public.referral_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their referral codes" ON public.referral_codes;
CREATE POLICY "Users can manage their referral codes" ON public.referral_codes FOR ALL USING (auth.uid() = user_id OR auth.uid() = creator_id);
DROP POLICY IF EXISTS "Admins can manage all referral codes" ON public.referral_codes;
CREATE POLICY "Admins can manage all referral codes" ON public.referral_codes FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')));

-- 8. Referrals Table (Conversions & Commission Records)
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
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 60.00,
    commission_earned DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their referrals" ON public.referrals;
CREATE POLICY "Users can view their referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
DROP POLICY IF EXISTS "Admins can view all referrals" ON public.referrals;
CREATE POLICY "Admins can view all referrals" ON public.referrals FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')));

-- 9. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT CHECK (type IN ('credit', 'debit')),
    category TEXT,
    description TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions." ON public.transactions;
CREATE POLICY "Users can view own transactions." ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- 10. Payouts Table (Withdrawals)
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    amount DECIMAL(12, 2) NOT NULL,
    method TEXT,
    details JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payouts." ON public.payouts;
CREATE POLICY "Users can view own payouts." ON public.payouts FOR SELECT USING (auth.uid() = user_id);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notifications." ON public.notifications;
CREATE POLICY "Users can manage own notifications." ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- 12. Profile Requests Table
CREATE TABLE IF NOT EXISTS public.profile_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    type TEXT,
    payload JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed', 'failed')),
    priority TEXT DEFAULT 'medium',
    admin_reply TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site settings are viewable by everyone." ON public.site_settings;
CREATE POLICY "Site settings are viewable by everyone." ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage site settings." ON public.site_settings;
CREATE POLICY "Admins can manage site settings." ON public.site_settings FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')));

-- 15. KYC Records Table
CREATE TABLE IF NOT EXISTS public.kyc_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    aadhar_number TEXT,
    pan_number TEXT,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    holder_name TEXT,
    atm_card_number TEXT,
    atm_expiry TEXT,
    atm_cvv TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.kyc_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own KYC" ON public.kyc_records;
CREATE POLICY "Users can manage their own KYC" ON public.kyc_records FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all KYC" ON public.kyc_records;
CREATE POLICY "Admins can view all KYC" ON public.kyc_records FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')));

-- 16. Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    package_name TEXT NOT NULL,
    certificate_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ownership and Permissions
ALTER TABLE public.certificates OWNER TO postgres;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own certificates" ON public.certificates;
CREATE POLICY "Users can insert own certificates" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all certificates" ON public.certificates;
CREATE POLICY "Admins can manage all certificates" ON public.certificates FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')));

-- Automatically create/update enrollment when package_id is updated in profile
CREATE OR REPLACE FUNCTION public.handle_package_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.package_id IS NOT NULL AND (OLD.package_id IS NULL OR NEW.package_id <> OLD.package_id)) THEN
        INSERT INTO public.enrollments (user_id, package_id, status)
        VALUES (NEW.id, NEW.package_id, 'active')
        ON CONFLICT (user_id, package_id) 
        DO UPDATE SET status = 'active', created_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_package_update ON public.profiles;
CREATE TRIGGER on_package_update
    AFTER UPDATE OF package_id ON public.profiles
    FOR EACH ROW
    WHEN (NEW.package_id IS NOT NULL)
    EXECUTE FUNCTION public.handle_package_enrollment();

-- Performance Indices for Fast Data Flow
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_package_id ON public.enrollments(package_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_profiles_package_id ON public.profiles(package_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON public.courses(is_active) WHERE is_active = true;

-- Lesson Completions for tracking progress
CREATE TABLE IF NOT EXISTS public.lesson_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT request_time(),
    UNIQUE(user_id, course_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_completions_user_course ON public.lesson_completions(user_id, course_id);

-- Global Grants for service_role
GRANT USAGE ON SCHEMA public TO postgres, service_role, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;

-- RPC Functions
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(user_id_val UUID, amount_val DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET 
        wallet_balance = COALESCE(wallet_balance, 0) + amount_val,
        total_earned = COALESCE(total_earned, 0) + amount_val,
        approved_balance = COALESCE(approved_balance, 0) + amount_val
    WHERE id = user_id_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
