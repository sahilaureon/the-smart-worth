-- 1. Update Referral Commission Logic
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
            WHERE referred_id::TEXT = NEW.id::TEXT OR (referred_email = NEW.email AND package_id::TEXT = NEW.package_id::TEXT)
        ) INTO already_referred;
        
        IF NOT already_referred THEN
            SELECT commission_paid INTO already_referred 
            FROM public.razorpay_orders 
            WHERE email = NEW.email AND package_id::TEXT = NEW.package_id::TEXT AND status = 'paid'
            ORDER BY created_at DESC LIMIT 1;
        END IF;

        IF NOT COALESCE(already_referred, false) THEN
            -- 1. Identify Referrer and Commission Percentage
            -- Check Custom Referral Codes first
            SELECT creator_id, earning_percent INTO referrer_id_val, earning_percent_val 
            FROM public.referral_codes 
            WHERE UPPER(TRIM(code)) = UPPER(TRIM(NEW.referred_by)) AND is_active = true
            LIMIT 1;
            
            IF referrer_id_val IS NOT NULL THEN
                is_custom_code := true;
            ELSE
                -- Fallback to Default User Referral Codes
                SELECT id INTO referrer_id_val 
                FROM public.profiles 
                WHERE UPPER(TRIM(referral_code)) = UPPER(TRIM(NEW.referred_by))
                LIMIT 1;
            END IF;

            -- 2. If Referrer found, calculate and credit commission
            IF referrer_id_val IS NOT NULL AND referrer_id_val::TEXT != NEW.id::TEXT THEN
                -- Fetch package details
                SELECT * INTO package_record FROM public.packages WHERE UPPER(TRIM(id::TEXT)) = UPPER(TRIM(NEW.package_id::TEXT)) LIMIT 1;
                
                IF FOUND THEN
                    -- LOGIC CHANGE: 
                    -- If custom code: use percentage of package price
                    -- If default code: use commission_direct from package table
                    IF is_custom_code THEN
                        commission_val := ROUND((COALESCE(package_record.offer_price, package_record.price) * COALESCE(earning_percent_val, 60) / 100), 2);
                    ELSE
                        commission_val := COALESCE(package_record.commission_direct, 0);
                        -- If commission_direct is 0, fallback to 60%
                        IF commission_val = 0 THEN
                            commission_val := ROUND((COALESCE(package_record.offer_price, package_record.price) * 60 / 100), 2);
                        END IF;
                    END IF;
                    
                    IF commission_val > 0 THEN
                        -- Credit Wallet
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

                        -- Mark order as commission paid
                        UPDATE public.razorpay_orders 
                        SET commission_paid = true 
                        WHERE email = NEW.email AND package_id::TEXT = NEW.package_id::TEXT AND status = 'paid';
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update RLS to allow referrers to see their referrals' details
DROP POLICY IF EXISTS "Referrers can view their referrals' profiles" ON public.profiles;
CREATE POLICY "Referrers can view their referrals' profiles" 
ON public.profiles 
FOR SELECT 
USING (
    referred_by IN (SELECT code FROM public.referral_codes WHERE creator_id = auth.uid()) 
    OR 
    referred_by = (SELECT referral_code FROM public.profiles WHERE id = auth.uid())
    OR
    auth.uid() = id -- Keep existing self-access
    OR
    public.is_admin() -- Keep existing admin access
);

-- 3. Grant permissions to ensure the view works
GRANT SELECT ON public.profiles TO authenticated;
