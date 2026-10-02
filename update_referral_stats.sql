-- Add clicks and enrollments columns to referral_codes
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS enrollments INTEGER DEFAULT 0;

-- Ensure RLS is correct
DROP POLICY IF EXISTS "Users can manage own referral codes." ON public.referral_codes;
CREATE POLICY "Users can manage own referral codes." 
ON public.referral_codes 
FOR ALL 
TO authenticated 
USING (auth.uid() = creator_id OR public.is_admin())
WITH CHECK (auth.uid() = creator_id OR public.is_admin());

DROP POLICY IF EXISTS "Referral codes are viewable by everyone." ON public.referral_codes;
CREATE POLICY "Referral codes are viewable by everyone." 
ON public.referral_codes 
FOR SELECT 
TO public 
USING (true);

-- Grant permissions
GRANT ALL ON public.referral_codes TO authenticated;
GRANT SELECT ON public.referral_codes TO anon;
GRANT ALL ON public.referral_codes TO service_role;
