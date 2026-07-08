-- Professional portfolios + marketplace visibility (Supabase).
-- Photos should be HTTPS URLs from Storage bucket `portfolio-media`, not base64 in rows.

CREATE TABLE IF NOT EXISTS public.portfolios (
  id text PRIMARY KEY,
  owner_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  craft text NOT NULL,
  full_name text,
  business_name text,
  city text,
  years_experience text,
  phone text,
  email text,
  license_number text,
  specialties jsonb DEFAULT '[]'::jsonb,
  photos jsonb DEFAULT '[]'::jsonb,
  cover_photo text,
  profile_photo text,
  testimonial text,
  slug text UNIQUE,
  published boolean NOT NULL DEFAULT false,
  profile_strength integer DEFAULT 0,
  step integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_published ON public.portfolios (published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_portfolios_owner ON public.portfolios (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_craft ON public.portfolios (craft) WHERE published = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE public.portfolios ADD COLUMN owner_user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolios_select_published" ON public.portfolios;
CREATE POLICY "portfolios_select_published" ON public.portfolios
  FOR SELECT TO authenticated, anon
  USING (published = true OR owner_user_id = auth.uid());

DROP POLICY IF EXISTS "portfolios_insert_own" ON public.portfolios;
CREATE POLICY "portfolios_insert_own" ON public.portfolios
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id IS NULL OR owner_user_id = auth.uid());

DROP POLICY IF EXISTS "portfolios_update_own" ON public.portfolios;
CREATE POLICY "portfolios_update_own" ON public.portfolios
  FOR UPDATE TO authenticated
  USING (owner_user_id IS NULL OR owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());
