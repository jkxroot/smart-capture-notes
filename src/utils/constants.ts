import { Category } from '../types/record';

export const APP_CONFIG = {
  NAME: 'Smart Capture & Notes',
  STORAGE_BUCKET: 'record-images',
  SIGNED_URL_EXPIRY_SECONDS: 3600, // 1 hour
  PAGE_SIZE: 50,
  SEARCH_DEBOUNCE_MS: 300,
  MAX_TITLE_LENGTH: 100,
  MAX_NOTES_LENGTH: 2000,
  COMPRESSION_MAX_WIDTH: 1600,
  COMPRESSION_QUALITY: 0.7,
  MAX_IMAGES_PER_RECORD: 5,
} as const;

export const CATEGORY_ICONS: Record<Category, string> = {
  Personal: 'person-outline',
  Work: 'briefcase-outline',
  Ideas: 'bulb-outline',
  Receipts: 'receipt-outline',
  Travel: 'airplane-outline',
  Other: 'folder-outline',
};
