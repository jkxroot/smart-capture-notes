-- ==============================================================================
-- Smart Capture & Notes - Supabase Database & Storage Schema
-- ==============================================================================

-- 1. Enable pgcrypto (for gen_random_uuid if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create the `records` table
CREATE TABLE IF NOT EXISTS public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  notes TEXT CHECK (char_length(notes) <= 2000),
  category TEXT NOT NULL CHECK (category IN ('Personal', 'Work', 'Ideas', 'Receipts', 'Travel', 'Other')),
  image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create index on (user_id, created_at desc) for efficient query sorting
CREATE INDEX IF NOT EXISTS idx_records_user_created ON public.records (user_id, created_at DESC);

-- 4. Automatically update `updated_at` timestamp via trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_records_updated_at ON public.records;
CREATE TRIGGER set_records_updated_at
  BEFORE UPDATE ON public.records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Enable Row Level Security (RLS) on `records`
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to allow safe re-runs
DROP POLICY IF EXISTS "Users can select own records" ON public.records;
DROP POLICY IF EXISTS "Users can insert own records" ON public.records;
DROP POLICY IF EXISTS "Users can update own records" ON public.records;
DROP POLICY IF EXISTS "Users can delete own records" ON public.records;

-- Allow authenticated users to view only their own records
CREATE POLICY "Users can select own records"
  ON public.records
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow authenticated users to insert records with their own user_id
CREATE POLICY "Users can insert own records"
  ON public.records
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to update only their own records
CREATE POLICY "Users can update own records"
  ON public.records
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to delete only their own records
CREATE POLICY "Users can delete own records"
  ON public.records
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ==============================================================================
-- Storage Configuration: Private bucket `record-images` with user isolation
-- ==============================================================================

-- Create bucket if not exists (marked private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'record-images',
  'record-images',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage Object RLS Policies
-- Isolated by path prefix: {user_id}/{record_id}.jpg
-- Uses (storage.foldername(name))[1] = auth.uid()::text

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
