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
import { escapeIlikePattern } from '../utils/escape';

export const recordService = {
  async getRecords(
    options: RecordFilterOptions = {}
  ): Promise<{ data: RecordItem[]; count: number | null; error: string | null }> {
    try {
      const {
        category,
        searchQuery,
        sortBy = 'newest',
        limit = APP_CONFIG.PAGE_SIZE,
        offset = 0,
      } = options;

      let query = supabase
        .from('records')
        .select('*', { count: 'exact' });

      // Always show pinned first
      query = query.order('is_pinned', { ascending: false, nullsFirst: false });

      // Secondary ordering
      if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (sortBy === 'alphabetical') {
        query = query.order('title', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(offset, offset + limit - 1);

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      const trimmedSearch = searchQuery?.trim() ?? '';
      if (trimmedSearch.length > 0) {
        // Prefer Postgres full-text search; fall back to escaped ILIKE.
        const ftsQuery = supabase
          .from('records')
          .select('*', { count: 'exact' })
          .order('is_pinned', { ascending: false, nullsFirst: false });

        let fts = ftsQuery.textSearch('search_tsv', trimmedSearch, {
          type: 'websearch',
          config: 'english',
        });

        if (sortBy === 'oldest') {
          fts = fts.order('created_at', { ascending: true });
        } else if (sortBy === 'alphabetical') {
          fts = fts.order('title', { ascending: true });
        } else {
          fts = fts.order('created_at', { ascending: false });
        }

        fts = fts.range(offset, offset + limit - 1);
        if (category && category !== 'All') {
          fts = fts.eq('category', category);
        }

        const ftsResult = await fts;
        if (!ftsResult.error) {
          return {
            data: (ftsResult.data as RecordItem[]) || [],
            count: ftsResult.count ?? null,
            error: null,
          };
        }

        const escaped = escapeIlikePattern(trimmedSearch);
        if (escaped.length > 0) {
          query = query.or(`title.ilike.%${escaped}%,notes.ilike.%${escaped}%`);
        }
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

  async createRecord(
    input: CreateRecordInput,
    recordId?: string
  ): Promise<{ data: RecordItem | null; error: string | null }> {
    try {
      const paths = input.image_paths?.filter(Boolean) ?? [];
      const primary = input.image_path || paths[0] || null;
      const recordPayload: Record<string, unknown> = {
        title: input.title.trim(),
        notes: input.notes?.trim() || null,
        category: input.category,
        image_path: primary,
        image_paths: paths.length > 0 ? paths : primary ? [primary] : [],
        is_pinned: input.is_pinned ?? false,
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

  async updateRecord(
    id: string,
    input: UpdateRecordInput
  ): Promise<{ data: RecordItem | null; error: string | null }> {
    try {
      const updatePayload: Record<string, unknown> = {};
      if (input.title !== undefined) updatePayload.title = input.title.trim();
      if (input.notes !== undefined) updatePayload.notes = input.notes ? input.notes.trim() : null;
      if (input.category !== undefined) updatePayload.category = input.category;
      if (input.image_paths !== undefined) {
        const paths = input.image_paths?.filter(Boolean) ?? [];
        updatePayload.image_paths = paths;
        updatePayload.image_path = paths[0] ?? null;
      } else if (input.image_path !== undefined) {
        updatePayload.image_path = input.image_path;
        updatePayload.image_paths = input.image_path ? [input.image_path] : [];
      }
      if (input.is_pinned !== undefined) updatePayload.is_pinned = input.is_pinned;

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
