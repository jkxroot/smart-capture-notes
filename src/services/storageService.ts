import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../utils/constants';
import { getFriendlyErrorMessage } from '../utils/errors';

interface CacheEntry {
  url: string;
  expiresAt: number;
}

// In-memory cache for signed URLs per image_path
const signedUrlCache = new Map<string, CacheEntry>();

export const storageService = {
  /**
   * Generates or retrieves a cached signed URL for a private image path.
   * Signed URLs are valid for 1 hour (3600 seconds) and cached in memory.
   */
  async getSignedUrl(imagePath: string): Promise<{ url: string | null; error: string | null }> {
    if (!imagePath) {
      return { url: null, error: null };
    }

    const now = Date.now();
    const cached = signedUrlCache.get(imagePath);

    // Return cached URL if it has at least 60 seconds of validity remaining
    if (cached && cached.expiresAt > now + 60 * 1000) {
      return { url: cached.url, error: null };
    }

    try {
      const { data, error } = await supabase.storage
        .from(APP_CONFIG.STORAGE_BUCKET)
        .createSignedUrl(imagePath, APP_CONFIG.SIGNED_URL_EXPIRY_SECONDS);

      if (error || !data?.signedUrl) {
        return {
          url: null,
          error: error ? getFriendlyErrorMessage(error) : 'Failed to create signed URL',
        };
      }

      // Cache signed URL (expire slightly before actual Supabase 1 hour expiration)
      signedUrlCache.set(imagePath, {
        url: data.signedUrl,
        expiresAt: now + (APP_CONFIG.SIGNED_URL_EXPIRY_SECONDS - 60) * 1000,
      });

      return { url: data.signedUrl, error: null };
    } catch (err) {
      return { url: null, error: getFriendlyErrorMessage(err) };
    }
  },

  /**
   * Reads a local file into an ArrayBuffer via base64-arraybuffer
   * and uploads it to the user's isolated folder in the private bucket.
   * Convention: {userId}/{recordId}.jpg
   */
  async uploadRecordImage(
    localUri: string,
    userId: string,
    recordId: string
  ): Promise<{ path: string | null; error: string | null }> {
    try {
      // 1. Read local file as base64
      const base64Data = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 2. Convert base64 to ArrayBuffer (reliable in React Native)
      const arrayBuffer = decode(base64Data);

      // 3. Upload to private bucket at path: {userId}/{recordId}.jpg
      const storagePath = `${userId}/${recordId}.jpg`;

      const { error } = await supabase.storage
        .from(APP_CONFIG.STORAGE_BUCKET)
        .upload(storagePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        return { path: null, error: getFriendlyErrorMessage(error) };
      }

      // Invalidate any existing cached signed URL for this path
      signedUrlCache.delete(storagePath);

      return { path: storagePath, error: null };
    } catch (err) {
      return { path: null, error: getFriendlyErrorMessage(err) };
    }
  },

  /**
   * Deletes an image object from the storage bucket and purges it from cache.
   */
  async deleteImage(imagePath: string): Promise<{ error: string | null }> {
    if (!imagePath) return { error: null };
    try {
      signedUrlCache.delete(imagePath);
      const { error } = await supabase.storage
        .from(APP_CONFIG.STORAGE_BUCKET)
        .remove([imagePath]);

      if (error) {
        return { error: getFriendlyErrorMessage(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: getFriendlyErrorMessage(err) };
    }
  },

  /**
   * Removes all cached signed URLs (e.g. on user logout)
   */
  clearCache(): void {
    signedUrlCache.clear();
  },
};
