-- Multi-image support + full-text search

ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS image_paths TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.records
SET image_paths = ARRAY[image_path]
WHERE image_path IS NOT NULL
  AND image_path <> ''
  AND (image_paths IS NULL OR cardinality(image_paths) = 0);

ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(notes, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_records_search_tsv
  ON public.records
  USING GIN (search_tsv);
