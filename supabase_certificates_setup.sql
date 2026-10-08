-- ==============================================================================
-- THE SMART WORTH - CERTIFICATE VERIFICATION SYSTEM SQL MIGRATION
-- Run this script in your Supabase Project -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create or alter the certificates table with all required fields
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    certificate_id TEXT,
    candidate_name TEXT,
    user_name TEXT,
    course_name TEXT,
    package_name TEXT,
    certificate_type TEXT DEFAULT 'Certificate of Completion',
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    completion_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'verified',
    issued_by TEXT DEFAULT 'The Smart Worth',
    verification_url TEXT,
    certificate_url TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Safely add any missing columns if the table already existed previously
DO $$ 
BEGIN
    -- Add certificate_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'certificate_id') THEN
        ALTER TABLE public.certificates ADD COLUMN certificate_id TEXT;
    END IF;

    -- Add candidate_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'candidate_name') THEN
        ALTER TABLE public.certificates ADD COLUMN candidate_name TEXT;
    END IF;

    -- Add course_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'course_name') THEN
        ALTER TABLE public.certificates ADD COLUMN course_name TEXT;
    END IF;

    -- Add certificate_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'certificate_type') THEN
        ALTER TABLE public.certificates ADD COLUMN certificate_type TEXT DEFAULT 'Certificate of Completion';
    END IF;

    -- Add issue_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'issue_date') THEN
        ALTER TABLE public.certificates ADD COLUMN issue_date TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add completion_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'completion_date') THEN
        ALTER TABLE public.certificates ADD COLUMN completion_date TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add status column (verified, pending, revoked)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'status') THEN
        ALTER TABLE public.certificates ADD COLUMN status TEXT DEFAULT 'verified';
    END IF;

    -- Add issued_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'issued_by') THEN
        ALTER TABLE public.certificates ADD COLUMN issued_by TEXT DEFAULT 'The Smart Worth';
    END IF;

    -- Add verification_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'verification_url') THEN
        ALTER TABLE public.certificates ADD COLUMN verification_url TEXT;
    END IF;

    -- Add email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'email') THEN
        ALTER TABLE public.certificates ADD COLUMN email TEXT;
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'updated_at') THEN
        ALTER TABLE public.certificates ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Relax non-null constraints on legacy columns to allow admin issuing without friction
ALTER TABLE public.certificates ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.certificates ALTER COLUMN certificate_url DROP NOT NULL;
ALTER TABLE public.certificates ALTER COLUMN user_name DROP NOT NULL;
ALTER TABLE public.certificates ALTER COLUMN package_name DROP NOT NULL;

-- 4. Sync legacy user_name and package_name if candidate_name or course_name are missing
UPDATE public.certificates
SET candidate_name = user_name
WHERE candidate_name IS NULL AND user_name IS NOT NULL;

UPDATE public.certificates
SET course_name = package_name
WHERE course_name IS NULL AND package_name IS NOT NULL;

UPDATE public.certificates
SET certificate_id = CONCAT('TSW-', EXTRACT(YEAR FROM created_at)::TEXT, '-', LPAD(SUBSTRING(id::TEXT, 1, 6), 6, '0'))
WHERE certificate_id IS NULL;

UPDATE public.certificates
SET status = 'verified'
WHERE status IS NULL;

UPDATE public.certificates
SET issued_by = 'The Smart Worth'
WHERE issued_by IS NULL;

UPDATE public.certificates
SET verification_url = CONCAT('https://verify.thesmartworth.site/certificate/', certificate_id)
WHERE verification_url IS NULL AND certificate_id IS NOT NULL;

-- 5. Create Fast Unique Index on certificate_id (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_cert_id_unique 
ON public.certificates (LOWER(certificate_id));

CREATE INDEX IF NOT EXISTS idx_certificates_user_id 
ON public.certificates (user_id);

CREATE INDEX IF NOT EXISTS idx_certificates_status 
ON public.certificates (status);

CREATE INDEX IF NOT EXISTS idx_certificates_created_at 
ON public.certificates (created_at DESC);

-- 6. Setup Row Level Security (RLS)
ALTER TABLE public.certificates OWNER TO postgres;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 6.1 Public Verification Access:
-- ANY visitor (unauthenticated or smartphone QR scan) can verify certificates by ID
DROP POLICY IF EXISTS "Public can view certificates for verification" ON public.certificates;
CREATE POLICY "Public can view certificates for verification" 
ON public.certificates 
FOR SELECT 
USING (true);

-- 6.2 Authenticated users can view their own certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
CREATE POLICY "Users can view own certificates" 
ON public.certificates 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 6.3 Authenticated users can create their own certificates upon course completion
DROP POLICY IF EXISTS "Users can insert own certificates" ON public.certificates;
CREATE POLICY "Users can insert own certificates" 
ON public.certificates 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 6.4 Admins have full access to manage all certificates
DROP POLICY IF EXISTS "Admins can manage all certificates" ON public.certificates;
CREATE POLICY "Admins can manage all certificates" 
ON public.certificates 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'ADMIN' OR role = 'superadmin')
  )
);

-- 7. Grant schema permissions for Anon, Authenticated, and Service Role
GRANT SELECT ON public.certificates TO anon, authenticated;
GRANT ALL ON public.certificates TO service_role;
GRANT ALL ON public.certificates TO authenticated;

-- 8. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_certificates_updated_at ON public.certificates;
CREATE TRIGGER trg_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_certificates_updated_at();

-- Verification Query (Run this to confirm setup):
-- SELECT id, certificate_id, candidate_name, course_name, status, verification_url FROM public.certificates LIMIT 10;
