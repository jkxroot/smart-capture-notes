export type Category = 'Personal' | 'Work' | 'Ideas' | 'Receipts' | 'Travel' | 'Other';

export const CATEGORIES: Category[] = [
  'Personal',
  'Work',
  'Ideas',
  'Receipts',
  'Travel',
  'Other',
];

export interface RecordItem {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  category: Category;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRecordInput {
  title: string;
  notes?: string | null;
  category: Category;
  image_path?: string | null;
}

export interface UpdateRecordInput {
  title?: string;
  notes?: string | null;
  category?: Category;
  image_path?: string | null;
}

export interface RecordFilterOptions {
  category?: Category | 'All';
  searchQuery?: string;
  limit?: number;
  offset?: number;
}
