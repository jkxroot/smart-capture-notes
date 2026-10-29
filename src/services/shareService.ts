import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { RecordItem } from '../types/record';
import { storageService } from './storageService';
import { formatFullDateTime } from '../utils/formatDate';

export const shareService = {
  /**
   * Shares a record via expo-sharing.
   * If the record has an image, downloads the image to a temporary file and shares it.
   * Also exports a formatted text file with title, category, date, and notes.
   */
  async shareRecord(record: RecordItem): Promise<{ success: boolean; error?: string }> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Sharing is not available on this device.',
        };
      }

      // If record has an image, fetch signed URL and download image to share
      if (record.image_path) {
        const { url, error } = await storageService.getSignedUrl(record.image_path);
        if (url && !error) {
          const localPath = `${FileSystem.cacheDirectory}share_${record.id}.jpg`;
          const downloadResult = await FileSystem.downloadAsync(url, localPath);

          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'image/jpeg',
            dialogTitle: `Share: ${record.title}`,
            UTI: 'public.jpeg',
          });
          return { success: true };
        }
      }

      // If no image or image download fails, export formatted summary document
      const summaryContent = [
        `Title: ${record.title}`,
        `Category: ${record.category}`,
        `Date: ${formatFullDateTime(record.created_at)}`,
        `\nNotes:\n${record.notes || '(No notes attached)'}`,
        `\n---\nExported from Smart Capture & Notes`,
      ].join('\n');

      const textFilePath = `${FileSystem.cacheDirectory}note_${record.id}.txt`;
      await FileSystem.writeAsStringAsync(textFilePath, summaryContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(textFilePath, {
        mimeType: 'text/plain',
        dialogTitle: `Share: ${record.title}`,
        UTI: 'public.plain-text',
      });

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to share record',
      };
    }
  },
};
