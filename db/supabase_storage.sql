-- Supabase Storage buckets for durable images (run in SQL editor).
-- Project v0 and draft portfolio media are private. Published portfolio paths
-- can be signed by public readers through a narrow storage policy.

ALTER TABLE public.portfolios
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('project-v0', 'project-v0', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('portfolio-media', 'portfolio-media', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Authenticated users upload only under their uid folder: {userId}/...
DROP POLICY IF EXISTS "project_v0_upload_own" ON storage.objects;
CREATE POLICY "project_v0_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-v0'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "project_v0_update_own" ON storage.objects;
CREATE POLICY "project_v0_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'project-v0' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "project_v0_select_public" ON storage.objects;
DROP POLICY IF EXISTS "project_v0_select_own" ON storage.objects;
CREATE POLICY "project_v0_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-v0'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "portfolio_media_upload_own" ON storage.objects;
CREATE POLICY "portfolio_media_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "portfolio_media_update_own" ON storage.objects;
CREATE POLICY "portfolio_media_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'portfolio-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.portfolio_media_object_name(p_media_url text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT coalesce(
    nullif(
      split_part(
        split_part(coalesce(p_media_url, ''), '/storage/v1/object/sign/portfolio-media/', 2),
        '?',
        1
      ),
      ''
    ),
    nullif(
      split_part(
        split_part(coalesce(p_media_url, ''), '/storage/v1/object/public/portfolio-media/', 2),
        '?',
        1
      ),
      ''
    )
  );
$$;

REVOKE ALL ON FUNCTION public.portfolio_media_object_name(text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.portfolio_media_is_published(p_object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.portfolios p
    WHERE p.published = true
      AND p.moderation_status = 'approved'
      AND p.owner_user_id::text = split_part(p_object_name, '/', 1)
      AND p.id::text = split_part(p_object_name, '/', 2)
      AND (
        public.portfolio_media_object_name(p.cover_photo) = p_object_name
        OR public.portfolio_media_object_name(p.profile_photo) = p_object_name
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(coalesce(p.photos, '[]'::jsonb)) AS media(url)
          WHERE public.portfolio_media_object_name(media.url) = p_object_name
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.portfolio_media_is_published(text) FROM public;
GRANT EXECUTE ON FUNCTION public.portfolio_media_is_published(text) TO anon, authenticated;

DROP POLICY IF EXISTS "portfolio_media_select_public" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_media_select_own" ON storage.objects;
CREATE POLICY "portfolio_media_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'portfolio-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "portfolio_media_select_published" ON storage.objects;
CREATE POLICY "portfolio_media_select_published" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'portfolio-media' AND public.portfolio_media_is_published(name));
