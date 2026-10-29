import { supabase } from '../lib/supabase';
import {
  RecordItem,
  CreateRecordInput,
  UpdateRecordInput,
  RecordFilterOptions,
  Category,
  CATEGORIES,
} from '../types/record';
import { APP_CONFIG } from '../utils/constants';
import { getFriendlyErrorMessage } from '../utils/errors';

export const recordService = {
  /**
   * Fetches records matching filters with pagination
   */
  async getRecords(
    options: RecordFilterOptions = {}
  ): Promise<{ data: RecordItem[]; count: number | null; error: string | null }> {
    try {
      const {
        category,
        searchQuery,
        limit = APP_CONFIG.PAGE_SIZE,
        offset = 0,
      } = options;

      let query = supabase
        .from('records')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Category filter
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      // Search filter across title and notes using ilike
      if (searchQuery && searchQuery.trim().length > 0) {
        const term = searchQuery.trim();
        query = query.or(`title.ilike.%${term}%,notes.ilike.%${term}%`);
      }

      const { data, count, error } = await query;

      if (error) {
        return { data: [], count: null, error: getFriendlyErrorMessage(error) };
      }

      return {
        data: (data as RecordItem[]) || [],
        count: count ?? null,
        error: null,
      };
    } catch (err) {
      return { data: [], count: null, error: getFriendlyErrorMessage(err) };
    }
  },

  /**
   * Fetches a single record by its ID
   */
  async getRecordById(id: string): Promise<{ data: RecordItem | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: getFriendlyErrorMessage(error) };
      }

      return { data: data as RecordItem, error: null };
    } catch (err) {
      return { data: null, error: getFriendlyErrorMessage(err) };
    }
  },

  /**
   * Creates a new record in the database
   */
  async createRecord(
    input: CreateRecordInput,
    recordId?: string
  ): Promise<{ data: RecordItem | null; error: string | null }> {
    try {
      const recordPayload: Record<string, unknown> = {
        title: input.title.trim(),
        notes: input.notes?.trim() || null,
        category: input.category,
        image_path: input.image_path || null,
      };

      if (recordId) {
        recordPayload.id = recordId;
      }

      const { data, error } = await supabase
        .from('records')
        .insert(recordPayload)
        .select()
        .single();

      if (error) {
        return { data: null, error: getFriendlyErrorMessage(error) };
      }

      return { data: data as RecordItem, error: null };
    } catch (err) {
      return { data: null, error: getFriendlyErrorMessage(err) };
    }
  },

  /**
   * Updates an existing record
   */
  async updateRecord(
    id: string,
    input: UpdateRecordInput
  ): Promise<{ data: RecordItem | null; error: string | null }> {
    try {
      const updatePayload: Record<string, unknown> = {};
      if (input.title !== undefined) updatePayload.title = input.title.trim();
      if (input.notes !== undefined) updatePayload.notes = input.notes ? input.notes.trim() : null;
      if (input.category !== undefined) updatePayload.category = input.category;
      if (input.image_path !== undefined) updatePayload.image_path = input.image_path;

      const { data, error } = await supabase
        .from('records')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: getFriendlyErrorMessage(error) };
      }

      return { data: data as RecordItem, error: null };
    } catch (err) {
      return { data: null, error: getFriendlyErrorMessage(err) };
    }
  },

  /**
   * Deletes a record from the database
   */
  async deleteRecord(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('records')
        .delete()
        .eq('id', id);

      if (error) {
        return { error: getFriendlyErrorMessage(error) };
      }

      return { error: null };
    } catch (err) {
      return { error: getFriendlyErrorMessage(err) };
    }
  },

  /**
   * Calculates record counts by category for the logged-in user (Bonus: Dashboard)
   */
  async getCategoryStats(): Promise<{
    stats: Record<Category, number>;
    total: number;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('records')
        .select('category');

      if (error) {
        return {
          stats: CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {} as Record<Category, number>),
          total: 0,
          error: getFriendlyErrorMessage(error),
        };
      }

      const initialStats: Record<Category, number> = {
        Personal: 0,
        Work: 0,
        Ideas: 0,
        Receipts: 0,
        Travel: 0,
        Other: 0,
      };

      let total = 0;
      data?.forEach((row) => {
        const cat = row.category as Category;
        if (cat && initialStats[cat] !== undefined) {
          initialStats[cat] += 1;
          total += 1;
        }
      });

      return { stats: initialStats, total, error: null };
    } catch (err) {
      return {
        stats: CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {} as Record<Category, number>),
        total: 0,
        error: getFriendlyErrorMessage(err),
      };
    }
  },
};
