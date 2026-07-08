-- Supabase Storage buckets for durable images (run in SQL editor).
-- Dashboard alternative: Storage → New bucket → public, same names.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('project-v0', 'project-v0', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('portfolio-media', 'portfolio-media', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
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
CREATE POLICY "project_v0_select_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'project-v0');

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

DROP POLICY IF EXISTS "portfolio_media_select_public" ON storage.objects;
CREATE POLICY "portfolio_media_select_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'portfolio-media');
