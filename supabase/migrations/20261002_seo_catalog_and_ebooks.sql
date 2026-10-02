-- ============================================================================
-- THE SMART WORTH — NON-DESTRUCTIVE SEO PRODUCT CATALOG & E-BOOKS MIGRATION
-- Safe, idempotent, additive migration (Does NOT drop, rename, or alter existing columns)
-- ============================================================================

-- 1. ADDITIVE SEO & CATEGORY COLUMNS FOR public.packages
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

-- Backfill package slugs safely where slug is null
UPDATE public.packages
SET slug = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_packages_slug ON public.packages(slug);
CREATE INDEX IF NOT EXISTS idx_packages_category ON public.packages(category);

-- 2. ADDITIVE SEO & CATEGORY COLUMNS FOR public.courses
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

-- Backfill course slugs safely where slug is null
UPDATE public.courses
SET slug = LOWER(REGEXP_REPLACE(TRIM(title), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND title IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);

-- 3. CREATE NEW public.ebooks TABLE (IF NOT EXISTS)
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

CREATE INDEX IF NOT EXISTS idx_ebooks_slug ON public.ebooks(slug);
CREATE INDEX IF NOT EXISTS idx_ebooks_category ON public.ebooks(category);
CREATE INDEX IF NOT EXISTS idx_ebooks_is_active ON public.ebooks(is_active);

-- 4. ROW LEVEL SECURITY FOR public.ebooks
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ebooks' AND policyname = 'Public can view active ebooks'
  ) THEN
    CREATE POLICY "Public can view active ebooks"
      ON public.ebooks
      FOR SELECT
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ebooks' AND policyname = 'Admins can manage ebooks'
  ) THEN
    CREATE POLICY "Admins can manage ebooks"
      ON public.ebooks
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
