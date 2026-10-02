-- ============================================================================
-- THE SMART WORTH — 100% REAL ADMIN-CONTROLLED COURSES & PACKAGES SQL
-- Copy & Paste this entire code into your Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

-- 1. Ensure all columns exist in public.packages with ZERO fake defaults
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='name') THEN
        ALTER TABLE public.packages ADD COLUMN name TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='description') THEN
        ALTER TABLE public.packages ADD COLUMN description TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='price') THEN
        ALTER TABLE public.packages ADD COLUMN price NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='original_price') THEN
        ALTER TABLE public.packages ADD COLUMN original_price NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='offer_price') THEN
        ALTER TABLE public.packages ADD COLUMN offer_price NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='discount_label') THEN
        ALTER TABLE public.packages ADD COLUMN discount_label TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='enrolled_count_text') THEN
        ALTER TABLE public.packages ADD COLUMN enrolled_count_text TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='button_text') THEN
        ALTER TABLE public.packages ADD COLUMN button_text TEXT DEFAULT 'Buy Now';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='badge_text') THEN
        ALTER TABLE public.packages ADD COLUMN badge_text TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='certificate_text') THEN
        ALTER TABLE public.packages ADD COLUMN certificate_text TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='thumbnail_url') THEN
        ALTER TABLE public.packages ADD COLUMN thumbnail_url TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='detail_thumbnail_url') THEN
        ALTER TABLE public.packages ADD COLUMN detail_thumbnail_url TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='banner_url') THEN
        ALTER TABLE public.packages ADD COLUMN banner_url TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='duration_text') THEN
        ALTER TABLE public.packages ADD COLUMN duration_text TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='perfect_for') THEN
        ALTER TABLE public.packages ADD COLUMN perfect_for TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='rating') THEN
        ALTER TABLE public.packages ADD COLUMN rating DECIMAL(3, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='features') THEN
        ALTER TABLE public.packages ADD COLUMN features JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='courses') THEN
        ALTER TABLE public.packages ADD COLUMN courses JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='is_active') THEN
        ALTER TABLE public.packages ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='packages' AND column_name='status') THEN
        ALTER TABLE public.packages ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- 2. Ensure all columns exist in public.courses with ZERO fake defaults
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='title') THEN
        ALTER TABLE public.courses ADD COLUMN title TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='description') THEN
        ALTER TABLE public.courses ADD COLUMN description TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='thumbnail_url') THEN
        ALTER TABLE public.courses ADD COLUMN thumbnail_url TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='detail_thumbnail_url') THEN
        ALTER TABLE public.courses ADD COLUMN detail_thumbnail_url TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='banner_url') THEN
        ALTER TABLE public.courses ADD COLUMN banner_url TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='lessons') THEN
        ALTER TABLE public.courses ADD COLUMN lessons JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='digit_lesson') THEN
        ALTER TABLE public.courses ADD COLUMN digit_lesson TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='duration_text') THEN
        ALTER TABLE public.courses ADD COLUMN duration_text TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='rating') THEN
        ALTER TABLE public.courses ADD COLUMN rating DECIMAL(3, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='category') THEN
        ALTER TABLE public.courses ADD COLUMN category TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='certificate_text') THEN
        ALTER TABLE public.courses ADD COLUMN certificate_text TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='button_text') THEN
        ALTER TABLE public.courses ADD COLUMN button_text TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='highlights') THEN
        ALTER TABLE public.courses ADD COLUMN highlights TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='show_on_home') THEN
        ALTER TABLE public.courses ADD COLUMN show_on_home BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='package_id') THEN
        ALTER TABLE public.courses ADD COLUMN package_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='is_active') THEN
        ALTER TABLE public.courses ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='updated_at') THEN
        ALTER TABLE public.courses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Remove any old default values from columns so new rows are 100% clean
ALTER TABLE public.packages ALTER COLUMN perfect_for SET DEFAULT '';
ALTER TABLE public.packages ALTER COLUMN rating SET DEFAULT 0;
ALTER TABLE public.courses ALTER COLUMN category SET DEFAULT '';
ALTER TABLE public.courses ALTER COLUMN rating SET DEFAULT 0;

UPDATE public.packages
SET perfect_for = ''
WHERE perfect_for = 'Students, Freelancers, Content Creators, Working Professionals, Aspiring Entrepreneurs';

UPDATE public.courses
SET category = ''
WHERE category = 'Masterclass';

-- 4. Ensure Public Read Policies on courses & packages
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Courses are viewable by everyone." ON public.courses;
CREATE POLICY "Courses are viewable by everyone."
ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Packages are viewable by everyone." ON public.packages;
CREATE POLICY "Packages are viewable by everyone."
ON public.packages FOR SELECT USING (true);

-- 5. Add SEO Product Catalog Columns & E-books Table (Non-Destructive)
ALTER TABLE public.packages
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS ebook_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT,
ADD COLUMN IF NOT EXISTS schema_type TEXT DEFAULT 'Product',
ADD COLUMN IF NOT EXISTS is_indexed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS package_id TEXT,
ADD COLUMN IF NOT EXISTS instructor TEXT,
ADD COLUMN IF NOT EXISTS level TEXT,
ADD COLUMN IF NOT EXISTS requirements TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS related_ebook_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS related_course_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT,
ADD COLUMN IF NOT EXISTS is_indexed BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS public.ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'Creator Worth',
  subcategory TEXT,
  package_id TEXT,
  related_package_ids TEXT[] DEFAULT '{}',
  related_course_ids TEXT[] DEFAULT '{}',
  cover_url TEXT,
  short_description TEXT,
  description TEXT,
  author TEXT,
  chapters JSONB DEFAULT '[]'::jsonb,
  learning_outcomes TEXT[] DEFAULT '{}',
  file_url TEXT,
  tags TEXT[] DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  is_active BOOLEAN DEFAULT true,
  is_indexed BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active ebooks" ON public.ebooks;
CREATE POLICY "Public can view active ebooks" ON public.ebooks FOR SELECT USING (is_active = true);

-- 6. Reload Supabase PostgREST Schema Cache Immediately
NOTIFY pgrst, 'reload schema';

