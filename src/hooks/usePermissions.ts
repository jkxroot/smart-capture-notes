import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';

export function usePermissions() {
  const [cameraGranted, setCameraGranted] = useState<boolean | null>(null);
  const [mediaLibraryGranted, setMediaLibraryGranted] = useState<boolean | null>(null);

  const checkPermissions = useCallback(async () => {
    try {
      const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
      setCameraGranted(cameraStatus.granted);

      const libraryStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
      setMediaLibraryGranted(libraryStatus.granted);
    } catch {
      // Permissions check fallback
    }
  }, []);

  return {
    cameraGranted,
    mediaLibraryGranted,
    checkPermissions,
  };
}
