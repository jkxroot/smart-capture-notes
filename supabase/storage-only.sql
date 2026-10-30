INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'record-images',
  'record-images',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Users can upload their own record images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own record images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own record images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own record images" ON storage.objects;

CREATE POLICY "Users can upload their own record images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'record-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own record images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'record-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own record images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'record-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'record-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own record images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'record-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'record-images';
