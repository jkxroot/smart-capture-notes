import { Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { captureRef } from 'react-native-view-shot';
import { RecordItem } from '../types/record';

export const shareService = {
  /**
   * Captures the rendered off-screen ShareCard view as a high-quality JPG image
   * and opens the platform sharing dialog. Cleans up the temporary file afterwards.
   */
  async shareImageCard(
    viewRef: React.RefObject<any> | any,
    title: string
  ): Promise<{ success: boolean; error?: string }> {
    let capturedUri: string | null = null;
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Sharing is not available on this device.',
        };
      }

      if (!viewRef || !viewRef.current) {
        return {
          success: false,
          error: 'Unable to capture note card for sharing.',
        };
      }

      capturedUri = await captureRef(viewRef, {
        format: 'jpg',
        quality: 0.92,
        result: 'tmpfile',
      });

      await Sharing.shareAsync(capturedUri, {
        mimeType: 'image/jpeg',
        dialogTitle: `Share: ${title}`,
        UTI: 'public.jpeg',
      });

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to share image card',
      };
    } finally {
      if (capturedUri) {
        FileSystem.deleteAsync(capturedUri, { idempotent: true }).catch(() => {});
      }
    }
  },

  /**
   * Shares note content as plain text using React Native's Share.share.
   * Handles user dismissal cleanly without an error.
   */
  async shareText(record: RecordItem): Promise<{ success: boolean; error?: string }> {
    try {
      const messageParts = [
        record.title,
        `Category: ${record.category}`,
        record.notes ? record.notes : '',
      ].filter(Boolean);

      const result = await Share.share({
        message: messageParts.join('\n\n'),
        title: record.title,
      });

      if (result.action === Share.sharedAction || result.action === Share.dismissedAction) {
        return { success: true };
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to share note text',
      };
    }
  },
};
