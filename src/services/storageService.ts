import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../utils/constants';
import { getFriendlyErrorMessage } from '../utils/errors';

interface CacheEntry {
  url: string;
  expiresAt: number;
}

const signedUrlCache = new Map<string, CacheEntry>();

function buildStoragePath(userId: string, recordId: string, index: number): string {
  return index === 0
    ? `${userId}/${recordId}.jpg`
    : `${userId}/${recordId}_${index}.jpg`;
}

export const storageService = {
  async getSignedUrl(imagePath: string): Promise<{ url: string | null; error: string | null }> {
    if (!imagePath) {
      return { url: null, error: null };
    }

    const now = Date.now();
    const cached = signedUrlCache.get(imagePath);

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

      signedUrlCache.set(imagePath, {
        url: data.signedUrl,
        expiresAt: now + (APP_CONFIG.SIGNED_URL_EXPIRY_SECONDS - 60) * 1000,
      });

      return { url: data.signedUrl, error: null };
    } catch (err) {
      return { url: null, error: getFriendlyErrorMessage(err) };
    }
  },

  async uploadRecordImage(
    localUri: string,
    userId: string,
    recordId: string,
    index: number = 0
  ): Promise<{ path: string | null; error: string | null }> {
    try {
      const base64Data = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = decode(base64Data);
      const storagePath = buildStoragePath(userId, recordId, index);

      const { error } = await supabase.storage
        .from(APP_CONFIG.STORAGE_BUCKET)
        .upload(storagePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        return { path: null, error: getFriendlyErrorMessage(error) };
      }

      signedUrlCache.delete(storagePath);
      return { path: storagePath, error: null };
    } catch (err) {
      return { path: null, error: getFriendlyErrorMessage(err) };
    }
  },

  async uploadRecordImages(
    localUris: string[],
    userId: string,
    recordId: string
  ): Promise<{ paths: string[]; error: string | null }> {
    const paths: string[] = [];
    for (let i = 0; i < localUris.length; i += 1) {
      const result = await this.uploadRecordImage(localUris[i], userId, recordId, i);
      if (result.error || !result.path) {
        for (const uploaded of paths) {
          await this.deleteImage(uploaded);
        }
        return { paths: [], error: result.error || 'Failed to upload photo.' };
      }
      paths.push(result.path);
    }
    return { paths, error: null };
  },

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

  async deleteImages(imagePaths: string[]): Promise<void> {
    const unique = [...new Set(imagePaths.filter(Boolean))];
    await Promise.all(unique.map((path) => this.deleteImage(path)));
  },

  clearCache(): void {
    signedUrlCache.clear();
  },
};
