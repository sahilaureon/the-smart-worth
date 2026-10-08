-- =========================================================================
-- THE SMART WORTH — CERTIFICATE VERIFICATION SYSTEM DATABASE MIGRATION
-- Enhances the existing 'public.certificates' table with unique verification
-- support, status lifecycle, and index optimizations.
-- =========================================================================

-- 1. Ensure certificates table exists
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    package_name TEXT,
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add verification fields to the existing certificates table if not present
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_id TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS candidate_name TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_type TEXT DEFAULT 'Certificate of Completion';
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issue_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'verified';
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issued_by TEXT DEFAULT 'The Smart Worth';
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS verification_url TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Backfill candidate_name and course_name from user_name and package_name if missing
UPDATE public.certificates
SET 
    candidate_name = COALESCE(candidate_name, user_name, 'Student'),
    course_name = COALESCE(course_name, package_name, 'Skill Specialization Program'),
    status = COALESCE(status, 'verified'),
    issued_by = COALESCE(issued_by, 'The Smart Worth')
WHERE candidate_name IS NULL OR course_name IS NULL;

-- 4. Backfill certificate_id for any existing records that do not have one
UPDATE public.certificates
SET certificate_id = 'TSW-' || TO_CHAR(COALESCE(created_at, NOW()), 'YYYY') || '-' || LPAD(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 6), 6, '0')
WHERE certificate_id IS NULL;

-- 5. Backfill verification_url
UPDATE public.certificates
SET verification_url = 'https://verify.thesmartworth.site/certificate/' || certificate_id
WHERE verification_url IS NULL;

-- 6. Create Unique Index on certificate_id (Prevents duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_cert_id_unique 
ON public.certificates (LOWER(certificate_id)) 
WHERE certificate_id IS NOT NULL;

-- 7. Add index for faster public verification lookups
CREATE INDEX IF NOT EXISTS idx_certificates_verification_lookup 
ON public.certificates (status, created_at DESC);

-- 8. Row Level Security (RLS) Policies
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Allow public to SELECT verified certificates for verification lookups
DROP POLICY IF EXISTS "Public can view certificates for verification" ON public.certificates;
CREATE POLICY "Public can view certificates for verification"
    ON public.certificates FOR SELECT
    USING (true);

-- Allow authenticated users to view their own certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
CREATE POLICY "Users can view own certificates"
    ON public.certificates FOR SELECT
    USING (auth.uid() = user_id);

-- Allow admins full control over certificates
DROP POLICY IF EXISTS "Admins can manage all certificates" ON public.certificates;
CREATE POLICY "Admins can manage all certificates"
    ON public.certificates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')
        )
    );
