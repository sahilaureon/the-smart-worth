-- MASTER SQL SETUP FOR THE SMART WORTH (ULTRA ADVANCE)
-- This script sets up all necessary tables for a course selling, wallet, and referral platform.

-- 1. CLEANUP (Optional: Only use if you want to reset everything)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- 2. TABLES

-- Profiles Table (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    mobile TEXT,
    password TEXT, -- For display or legacy, auth is handled by Supabase Auth
    dob DATE,
    gender TEXT,
    state TEXT,
    city TEXT,
    pin_code TEXT,
    referral_code TEXT UNIQUE,
    referred_by TEXT, -- Removed FK to allow custom referral codes from referral_codes table
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
    referred_email TEXT, -- Added for tracking pre-signup referrals
    package_id TEXT REFERENCES public.packages(id),
    order_id TEXT,
    payment_id TEXT,
    amount DECIMAL(12,2),
    commission_earned DECIMAL(12,2),
    commission_amount DECIMAL(12,2), -- Legacy field
    level INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout Requests Table
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    method TEXT, -- 'bank', 'upi', etc.
    details JSONB,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'paid'
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

-- Notifications Table (Real-time)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT, -- 'info', 'success', 'warning', 'error'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile Update Requests Table
CREATE TABLE IF NOT EXISTS public.profile_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_email TEXT,
    user_name TEXT,
    user_profile_pic TEXT,
    requested_changes JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_id UUID REFERENCES public.profiles(id),
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson Chats Table
CREATE TABLE IF NOT EXISTS public.lesson_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson Completions Table
CREATE TABLE IF NOT EXISTS public.lesson_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- User Course Progress Table (Tracks last watched lesson)
CREATE TABLE IF NOT EXISTS public.user_course_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    last_lesson_index INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Policies for Lesson Chats
ALTER TABLE public.lesson_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lesson chats are viewable by everyone." ON public.lesson_chats FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post chats." ON public.lesson_chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage chats." ON public.lesson_chats FOR ALL USING (public.is_admin());

-- Policies for Lesson Completions
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own completions." ON public.lesson_completions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can mark own lessons as completed." ON public.lesson_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own completions." ON public.lesson_completions FOR DELETE USING (auth.uid() = user_id);

-- Policies for User Course Progress
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own course progress." ON public.user_course_progress FOR ALL USING (auth.uid() = user_id OR public.is_admin());

GRANT ALL ON public.lesson_chats TO authenticated, service_role, anon;
GRANT ALL ON public.lesson_completions TO authenticated, service_role, anon;
GRANT ALL ON public.user_course_progress TO authenticated, service_role, anon;

-- Referral Codes Table (Custom codes generated by users)
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

-- Withdrawal Methods Table
CREATE TABLE IF NOT EXISTS public.withdrawal_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('upi', 'bank')),
    details JSONB NOT NULL,
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
    status TEXT DEFAULT 'created', -- 'created', 'paid', 'failed'
    referral_code TEXT,
    is_pre_signup BOOLEAN DEFAULT false,
    commission_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases Table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    package_id TEXT REFERENCES public.packages(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_id TEXT,
    order_id TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies for Purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own purchases." ON public.purchases FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Service role can manage purchases." ON public.purchases FOR ALL USING (true);
GRANT ALL ON public.purchases TO anon, authenticated, service_role;

-- 3. RLS (ROW LEVEL SECURITY)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_orders ENABLE ROW LEVEL SECURITY;

-- Grant permissions (CRITICAL)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Policies for Referral Codes
CREATE POLICY "Referral codes are viewable by everyone." ON public.referral_codes FOR SELECT USING (true);
CREATE POLICY "Users can manage own referral codes." ON public.referral_codes FOR ALL USING (auth.uid() = creator_id OR public.is_admin());

-- Policies for Withdrawal Methods
CREATE POLICY "Users can manage own withdrawal methods." ON public.withdrawal_methods FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Policies for Razorpay Orders
CREATE POLICY "Users can view own orders." ON public.razorpay_orders FOR SELECT USING (auth.uid() = user_id OR email = auth.jwt()->>'email' OR public.is_admin());
CREATE POLICY "Service role can manage orders." ON public.razorpay_orders FOR ALL USING (true);

GRANT ALL ON public.profile_requests TO authenticated;
GRANT ALL ON public.profile_requests TO service_role;
GRANT ALL ON public.profile_requests TO postgres;
GRANT ALL ON public.profile_requests TO anon;

GRANT ALL ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
GRANT ALL ON public.site_settings TO postgres;
GRANT ALL ON public.site_settings TO anon;

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

-- RPC: Increment Referral Clicks
CREATE OR REPLACE FUNCTION public.increment_referral_clicks(code_val TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.referral_codes
  SET clicks = clicks + 1
  WHERE UPPER(TRIM(code)) = UPPER(TRIM(code_val));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Increment Referral Enrollments
CREATE OR REPLACE FUNCTION public.increment_referral_enrollments(code_val TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.referral_codes
  SET enrollments = enrollments + 1
  WHERE UPPER(TRIM(code)) = UPPER(TRIM(code_val));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Increment Wallet Balance
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

-- Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can insert own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admins can delete profiles." ON public.profiles FOR DELETE USING (public.is_admin());

-- Policies for Packages (Publicly viewable)
CREATE POLICY "Packages are viewable by everyone." ON public.packages FOR SELECT USING (true);
CREATE POLICY "Admins can manage packages." ON public.packages FOR ALL USING (public.is_admin());

-- Policies for Transactions (User only)
CREATE POLICY "Users can view own transactions." ON public.transactions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can manage transactions." ON public.transactions FOR ALL USING (public.is_admin());

-- Policies for Notifications (User only)
CREATE POLICY "Users can view own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can update own notifications." ON public.notifications FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can manage notifications." ON public.notifications FOR ALL USING (public.is_admin());

-- Policies for Profile Requests
DROP POLICY IF EXISTS "Users can view own requests." ON public.profile_requests;
DROP POLICY IF EXISTS "Users can insert own requests." ON public.profile_requests;
DROP POLICY IF EXISTS "Admins can manage requests." ON public.profile_requests;
DROP POLICY IF EXISTS "Service role bypass" ON public.profile_requests;

CREATE POLICY "Users can view own requests." ON public.profile_requests FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert own requests." ON public.profile_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage requests." ON public.profile_requests FOR ALL USING (public.is_admin());
CREATE POLICY "Service role bypass" ON public.profile_requests FOR ALL USING (true) WITH CHECK (true);

-- Policies for Payouts
CREATE POLICY "Users can view own payouts." ON public.payouts FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert own payouts." ON public.payouts FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can manage payouts." ON public.payouts FOR ALL USING (public.is_admin());

-- Policies for Courses & Lessons
CREATE POLICY "Courses are viewable by everyone." ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage courses." ON public.courses FOR ALL USING (public.is_admin());
CREATE POLICY "Lessons are viewable by everyone." ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Admins can manage lessons." ON public.lessons FOR ALL USING (public.is_admin());

-- Policies for Referrals
CREATE POLICY "Users can view own referrals." ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.is_admin());
CREATE POLICY "Admins can manage referrals." ON public.referrals FOR ALL USING (public.is_admin());

-- Policies for Enrollments
CREATE POLICY "Users can view own enrollments." ON public.enrollments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can manage enrollments." ON public.enrollments FOR ALL USING (public.is_admin());

-- Policies for Site Settings
DROP POLICY IF EXISTS "Site settings are viewable by everyone." ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage site settings." ON public.site_settings;

CREATE POLICY "Site settings are viewable by everyone." ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users full access to site settings." ON public.site_settings FOR ALL USING (auth.role() = 'authenticated');

-- 4. FUNCTIONS & TRIGGERS

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles
CREATE OR REPLACE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for user_course_progress
CREATE OR REPLACE TRIGGER update_user_course_progress_updated_at
BEFORE UPDATE ON public.user_course_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration and referral commission
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    referrer_id_val UUID;
    earning_percent_val DECIMAL;
    package_record RECORD;
    commission_val DECIMAL;
    already_referred BOOLEAN;
BEGIN
    -- Only proceed if package_id is set and referred_by is set
    IF NEW.package_id IS NOT NULL AND NEW.referred_by IS NOT NULL THEN
        -- Check if this user has already been credited for a referral to avoid double payment
        -- We check both the referrals table and the razorpay_orders table for robustness
        SELECT EXISTS (
            SELECT 1 FROM public.referrals 
            WHERE referred_id = NEW.id OR (referred_email = NEW.email AND package_id = NEW.package_id)
        ) INTO already_referred;
        
        IF NOT already_referred THEN
            -- Also check razorpay_orders as a secondary source of truth
            SELECT commission_paid INTO already_referred 
            FROM public.razorpay_orders 
            WHERE email = NEW.email AND package_id = NEW.package_id AND status = 'paid'
            ORDER BY created_at DESC LIMIT 1;
        END IF;

        IF NOT COALESCE(already_referred, false) THEN
            -- 1. Identify Referrer and Commission Percentage
            -- Check Custom Referral Codes first (Case-insensitive)
            SELECT creator_id, earning_percent INTO referrer_id_val, earning_percent_val 
            FROM public.referral_codes 
            WHERE UPPER(TRIM(code)) = UPPER(TRIM(NEW.referred_by)) AND is_active = true
            LIMIT 1;
            
            -- Fallback to Default User Referral Codes (Case-insensitive)
            IF referrer_id_val IS NULL THEN
                SELECT id INTO referrer_id_val 
                FROM public.profiles 
                WHERE UPPER(TRIM(referral_code)) = UPPER(TRIM(NEW.referred_by))
                LIMIT 1;
                earning_percent_val := 60; -- Default 60% for profile referrals
            END IF;

            -- 2. If Referrer found, calculate and credit commission
            IF referrer_id_val IS NOT NULL AND referrer_id_val != NEW.id THEN
                -- Fetch package details (Case-insensitive ID comparison)
                SELECT * INTO package_record FROM public.packages WHERE UPPER(TRIM(id)) = UPPER(TRIM(NEW.package_id)) LIMIT 1;
                
                IF FOUND THEN
                    -- Calculate commission safely
                    commission_val := ROUND((COALESCE(package_record.offer_price, package_record.price) * COALESCE(earning_percent_val, 60) / 100), 2);
                    
                    IF commission_val > 0 THEN
                        -- Credit Wallet, Total Earned and Approved Balance
                        UPDATE public.profiles 
                        SET wallet_balance = COALESCE(wallet_balance, 0) + commission_val,
                            total_earned = COALESCE(total_earned, 0) + commission_val,
                            approved_balance = COALESCE(approved_balance, 0) + commission_val
                        WHERE id = referrer_id_val;
                        
                        -- Record Transaction
                        INSERT INTO public.transactions (user_id, amount, type, category, description)
                        VALUES (referrer_id_val, commission_val, 'credit', 'referral', 'Referral commission from ' || COALESCE(NEW.full_name, 'New User'));
                        
                        -- Record Referral
                        INSERT INTO public.referrals (referrer_id, referred_id, referred_email, package_id, commission_earned, status)
                        VALUES (referrer_id_val, NEW.id, NEW.email, NEW.package_id, commission_val, 'completed');
                        
                        -- Notify Referrer
                        INSERT INTO public.notifications (user_id, title, message, type)
                        VALUES (referrer_id_val, 'New Referral!', 'You earned ₹' || commission_val || ' from ' || COALESCE(NEW.full_name, 'New User'), 'success');

                        -- Mark order as commission paid if we can find it
                        UPDATE public.razorpay_orders 
                        SET commission_paid = true 
                        WHERE email = NEW.email AND package_id = NEW.package_id AND status = 'paid';
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fail-safe: log warning but don't block registration
    RAISE WARNING 'Commission calculation failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger to fire on INSERT and UPDATE
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
AFTER INSERT OR UPDATE OF package_id, referred_by ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- User Learning Summary View
CREATE OR REPLACE VIEW public.user_learning_summary AS
SELECT 
    p.id as user_id,
    c.id as course_id,
    c.title as course_title,
    c.description as course_description,
    c.thumbnail_url,
    (SELECT COUNT(*) FROM public.lessons l2 WHERE l2.course_id = c.id) as total_lessons,
    (SELECT COUNT(*) FROM public.lesson_completions lc2 
     JOIN public.lessons l3 ON lc2.lesson_id = l3.id 
     WHERE lc2.user_id = p.id AND l3.course_id = c.id) as completed_lessons,
    COALESCE(ucp.last_lesson_index, 0) as last_lesson_index,
    ucp.updated_at as last_watched_at
FROM 
    public.profiles p
JOIN 
    public.packages pkg ON p.package_id::text = pkg.id::text
CROSS JOIN 
    jsonb_array_elements_text(pkg.courses) as course_id_text
JOIN 
    public.courses c ON c.id::text = course_id_text
LEFT JOIN 
    public.user_course_progress ucp ON ucp.user_id = p.id AND ucp.course_id = c.id;

-- User Referral Stats View
CREATE OR REPLACE VIEW public.user_referral_stats AS
SELECT 
    p.id as user_id,
    p.referral_code,
    (SELECT COUNT(*) FROM public.profiles p2 WHERE p2.referred_by = p.referral_code) as total_referrals,
    (SELECT COUNT(*) FROM public.referrals r WHERE r.referrer_id = p.id AND r.status = 'completed') as successful_referrals,
    (SELECT COALESCE(SUM(amount), 0) FROM public.transactions t WHERE t.user_id = p.id AND t.category = 'referral' AND t.type = 'credit') as total_referral_earnings,
    (SELECT COUNT(*) FROM public.referral_codes rc WHERE rc.creator_id = p.id) as custom_codes_count
FROM 
    public.profiles p;

GRANT SELECT ON public.user_learning_summary TO authenticated, service_role;
GRANT SELECT ON public.user_referral_stats TO authenticated, service_role;

-- Leaderboard View (Top Earners)
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
    p.id as user_id,
    p.full_name,
    p.profile_pic,
    p.total_earned,
    (SELECT COUNT(*) FROM public.profiles p2 WHERE p2.referred_by = p.referral_code) as referral_count
FROM 
    public.profiles p
WHERE 
    p.is_active = true
ORDER BY 
    p.total_earned DESC
LIMIT 100;

GRANT SELECT ON public.leaderboard TO authenticated, anon;

-- Daily Earnings View (Last 30 Days)
CREATE OR REPLACE VIEW public.daily_earnings AS
SELECT 
    user_id,
    DATE(created_at) as date,
    SUM(amount) as total_amount
FROM 
    public.transactions
WHERE 
    type = 'credit' 
    AND category = 'referral'
    AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY 
    user_id, DATE(created_at)
ORDER BY 
    date ASC;

GRANT SELECT ON public.daily_earnings TO authenticated, service_role;

-- 5. INITIAL DATA (Optional)
INSERT INTO public.packages (id, name, price, commission_direct, commission_indirect)
VALUES 
('silver', 'Silver Package', 599, 400, 50),
('gold', 'Gold Package', 1199, 800, 100),
('platinum', 'Platinum Package', 2499, 1700, 200)
ON CONFLICT (id) DO NOTHING;

-- Initial Site Settings
INSERT INTO public.site_settings (key, value, description)
VALUES 
('loading_logo', 'https://i.postimg.cc/zBYXxpq0/Picsart-26-03-18-16-54-04-376.png', 'The logo displayed on the loading screen'),
('site_title', 'The Smart Worth', 'The name of the website'),
('site_description', 'The Smart Worth empowers learners to enhance their skills and knowledge through accessible and comprehensive learning resources.', 'The description of the website')
ON CONFLICT (key) DO NOTHING;

-- User uploads (screenshots, etc)
CREATE TABLE IF NOT EXISTS public.user_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'image' or 'pdf'
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin sent files (certificates, etc)
CREATE TABLE IF NOT EXISTS public.user_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    type TEXT NOT NULL, -- 'certificate', 'document', etc
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;

-- Policies for user_uploads
CREATE POLICY "Users can view their own uploads" ON public.user_uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own uploads" ON public.user_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own uploads" ON public.user_uploads FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_files
CREATE POLICY "Users can view files sent to them" ON public.user_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all user files" ON public.user_files FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
