import { useState, useCallback } from 'react';
import { imageService } from '../services/imageService';
import { useToast } from '../context/ToastContext';

export function useImagePicker(initialUri: string | null = null) {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(initialUri);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { showToast } = useToast();

  const takePhoto = useCallback(async (): Promise<string | null> => {
    setIsProcessing(true);
    try {
      const result = await imageService.capturePhoto();
      if (result.canceled || !result.uri) {
        if (result.error) {
          showToast(result.error, 'error');
        }
        return null;
      }

      // Automatically compress photo to max 1600px width and 0.7 quality
      const compressed = await imageService.compressImage(result.uri, result.width);
      setSelectedImageUri(compressed.uri);
      return compressed.uri;
    } catch {
      showToast('Failed to capture photo.', 'error');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [showToast]);

  const pickFromGallery = useCallback(async (): Promise<string | null> => {
    setIsProcessing(true);
    try {
      const result = await imageService.pickImageFromGallery();
      if (result.canceled || !result.uri) {
        if (result.error) {
          showToast(result.error, 'error');
        }
        return null;
      }

      // Automatically compress photo to max 1600px width and 0.7 quality
      const compressed = await imageService.compressImage(result.uri, result.width);
      setSelectedImageUri(compressed.uri);
      return compressed.uri;
    } catch {
      showToast('Failed to select image from gallery.', 'error');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [showToast]);

  const clearImage = useCallback(() => {
    setSelectedImageUri(null);
  }, []);

  return {
    selectedImageUri,
    setSelectedImageUri,
    isProcessing,
    takePhoto,
    pickFromGallery,
    clearImage,
  };
}
