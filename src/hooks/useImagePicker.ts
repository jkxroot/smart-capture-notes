import { useState, useCallback } from 'react';
import { imageService } from '../services/imageService';
import { useToast } from '../context/ToastContext';
import { APP_CONFIG } from '../utils/constants';

export function useImagePicker(initialUris: string[] = []) {
  const [selectedImageUris, setSelectedImageUris] = useState<string[]>(initialUris);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { showToast } = useToast();

  const appendUri = useCallback((uri: string) => {
    setSelectedImageUris((prev) => {
      if (prev.length >= APP_CONFIG.MAX_IMAGES_PER_RECORD) {
        showToast(`Maximum ${APP_CONFIG.MAX_IMAGES_PER_RECORD} photos per note.`, 'info');
        return prev;
      }
      return [...prev, uri];
    });
  }, [showToast]);

  const takePhoto = useCallback(async (): Promise<string | null> => {
    setIsProcessing(true);
    try {
      const result = await imageService.capturePhoto();
      if (result.canceled || !result.uri) {
        if (result.error) showToast(result.error, 'error');
        return null;
      }
      const compressed = await imageService.compressImage(result.uri, result.width);
      appendUri(compressed.uri);
      return compressed.uri;
    } catch {
      showToast('Failed to capture photo.', 'error');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [appendUri, showToast]);

  const pickFromGallery = useCallback(async (): Promise<string | null> => {
    setIsProcessing(true);
    try {
      const result = await imageService.pickImageFromGallery();
      if (result.canceled || !result.uri) {
        if (result.error) showToast(result.error, 'error');
        return null;
      }
      const compressed = await imageService.compressImage(result.uri, result.width);
      appendUri(compressed.uri);
      return compressed.uri;
    } catch {
      showToast('Failed to select image from gallery.', 'error');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [appendUri, showToast]);

  const removeAt = useCallback((index: number) => {
    setSelectedImageUris((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearImages = useCallback(() => {
    setSelectedImageUris([]);
  }, []);

  return {
    selectedImageUris,
    setSelectedImageUris,
    /** @deprecated use selectedImageUris */
    selectedImageUri: selectedImageUris[0] ?? null,
    isProcessing,
    takePhoto,
    pickFromGallery,
    removeAt,
    clearImages,
    clearImage: clearImages,
  };
}
