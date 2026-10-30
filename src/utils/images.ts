import { RecordItem } from '../types/record';

/** Prefer image_paths[]; fall back to legacy single image_path. */
export function getRecordImagePaths(record: Pick<RecordItem, 'image_path' | 'image_paths'>): string[] {
  if (record.image_paths && record.image_paths.length > 0) {
    return record.image_paths.filter(Boolean);
  }
  return record.image_path ? [record.image_path] : [];
}

export function getPrimaryImagePath(
  record: Pick<RecordItem, 'image_path' | 'image_paths'>
): string | null {
  const paths = getRecordImagePaths(record);
  return paths[0] ?? null;
}

export function normalizeLocalImageUris(
  input?: string | string[] | null
): string[] {
  if (!input) return [];
  if (typeof input === 'string') return input ? [input] : [];
  return input.filter(Boolean);
}
