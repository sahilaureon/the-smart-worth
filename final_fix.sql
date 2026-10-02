-- FINAL MASTER FIX FOR THE SMART WORTH (v2)
-- Run this in Supabase SQL Editor to fix all registration and referral errors.

-- 1. Ensure Columns Exist in Profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='referred_by') THEN
        ALTER TABLE public.profiles ADD COLUMN referred_by UUID REFERENCES public.profiles(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='referral_code') THEN
        ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='package_id') THEN
        ALTER TABLE public.profiles ADD COLUMN package_id TEXT;
    END IF;
END $$;

-- 2. Ensure Columns Exist in Referrals
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='referrals' AND column_name='referred_id') THEN
        ALTER TABLE public.referrals ADD COLUMN referred_id UUID REFERENCES public.profiles(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='referrals' AND column_name='referrer_id') THEN
        ALTER TABLE public.referrals ADD COLUMN referrer_id UUID REFERENCES public.profiles(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='referrals' AND column_name='referred_email') THEN
        ALTER TABLE public.referrals ADD COLUMN referred_email TEXT;
    END IF;
END $$;

-- 3. Create Helper RPC for Atomic Wallet Updates
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(user_id_val UUID, amount_val NUMERIC)
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

-- 4. Update handle_new_user_registration Function
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    referrer_id_val UUID;
    earning_percent_val DECIMAL;
    package_record RECORD;
    commission_val DECIMAL;
    already_referred BOOLEAN;
    is_custom_code BOOLEAN := false;
BEGIN
    -- Only proceed if package_id is set and referred_by is set
    IF NEW.package_id IS NOT NULL AND NEW.referred_by IS NOT NULL THEN
        -- Check if this user has already been credited
        SELECT EXISTS (
            SELECT 1 FROM public.referrals 
            WHERE referred_id = NEW.id OR (referred_email = NEW.email AND package_id = NEW.package_id)
        ) INTO already_referred;
        
        IF NOT COALESCE(already_referred, false) THEN
            -- 1. Identify Referrer
            referrer_id_val := NEW.referred_by;

            -- 2. If Referrer found, calculate and credit commission
            IF referrer_id_val IS NOT NULL AND referrer_id_val != NEW.id THEN
                -- Fetch package details
                SELECT * INTO package_record FROM public.packages WHERE id = NEW.package_id LIMIT 1;
                
                IF FOUND THEN
                    -- Default commission from package table
                    commission_val := COALESCE(package_record.commission_direct, 0);
                    
                    -- If commission_direct is 0, fallback to 60%
                    IF commission_val = 0 THEN
                        commission_val := ROUND((COALESCE(package_record.offer_price, package_record.price) * 60 / 100), 2);
                    END IF;
                    
                    IF commission_val > 0 THEN
                        -- Credit Wallet
                        PERFORM public.increment_wallet_balance(referrer_id_val, commission_val);
                        
                        -- Record Transaction
                        INSERT INTO public.transactions (user_id, amount, type, category, description)
                        VALUES (referrer_id_val, commission_val, 'credit', 'referral', 'Referral commission from ' || COALESCE(NEW.full_name, 'New User'));
                        
                        -- Record Referral
                        INSERT INTO public.referrals (referrer_id, referred_id, referred_email, package_id, commission_earned, status)
                        VALUES (referrer_id_val, NEW.id, NEW.email, NEW.package_id, commission_val, 'completed');
                        
                        -- Notify Referrer
                        INSERT INTO public.notifications (user_id, title, message, type)
                        VALUES (referrer_id_val, 'New Referral!', 'You earned ₹' || commission_val || ' from ' || COALESCE(NEW.full_name, 'New User'), 'success');

                        -- Mark order as commission paid
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

-- 5. Re-create Trigger
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
AFTER INSERT OR UPDATE OF package_id, referred_by ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- 6. Fix RLS Policies for Profiles
DROP POLICY IF EXISTS "Referrers can view their referrals' profiles" ON public.profiles;
CREATE POLICY "Referrers can view their referrals' profiles" 
ON public.profiles 
FOR SELECT 
USING (
    referred_by = auth.uid()
    OR
    auth.uid() = id
    OR
    public.is_admin()
);

-- 7. Ensure Views are Correct
CREATE OR REPLACE VIEW public.user_referral_stats AS
SELECT 
    p.id as user_id,
    p.referral_code,
    (SELECT COUNT(*) FROM public.profiles p2 WHERE p2.referred_by = p.id) as total_referrals,
    (SELECT COUNT(*) FROM public.referrals r WHERE r.referrer_id = p.id AND r.status = 'completed') as successful_referrals,
    (SELECT COALESCE(SUM(amount), 0) FROM public.transactions t WHERE t.user_id = p.id AND t.category = 'referral' AND t.type = 'credit') as total_referral_earnings,
    (SELECT COUNT(*) FROM public.referral_codes rc WHERE rc.creator_id = p.id) as custom_codes_count
FROM 
    public.profiles p;

GRANT SELECT ON public.user_referral_stats TO authenticated, service_role;
