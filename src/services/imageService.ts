import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { APP_CONFIG } from '../utils/constants';

export interface PickImageResult {
  canceled: boolean;
  uri?: string;
  width?: number;
  height?: number;
  error?: string;
}

export const imageService = {
  /**
   * Prompts the user to open device settings if permission was denied.
   */
  showPermissionAlert(type: 'camera' | 'photo library'): void {
    Alert.alert(
      'Permission Required',
      `Smart Capture & Notes needs access to your ${type} to attach pictures to your notes. Please enable it in Settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  },

  /**
   * Launches the camera to capture a new photo.
   * Handles permissions and returns the local URI.
   */
  async capturePhoto(): Promise<PickImageResult> {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        if (!permission.canAskAgain) {
          this.showPermissionAlert('camera');
        }
        return { canceled: true, error: 'Camera permission denied' };
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 1, // Full quality here; compression occurs in separate step
        allowsEditing: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { canceled: true };
      }

      const asset = result.assets[0];
      return {
        canceled: false,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      };
    } catch (err) {
      return {
        canceled: true,
        error: err instanceof Error ? err.message : 'Failed to launch camera',
      };
    }
  },

  /**
   * Opens the photo library picker.
   * Handles permissions and returns the local URI.
   */
  async pickImageFromGallery(): Promise<PickImageResult> {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        if (!permission.canAskAgain) {
          this.showPermissionAlert('photo library');
        }
        return { canceled: true, error: 'Photo library permission denied' };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { canceled: true };
      }

      const asset = result.assets[0];
      return {
        canceled: false,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      };
    } catch (err) {
      return {
        canceled: true,
        error: err instanceof Error ? err.message : 'Failed to select image',
      };
    }
  },

  /**
   * Compresses an image:
   * 1. Resizes down to max width 1600px if wider (preserving aspect ratio)
   * 2. Encodes to JPEG with 0.7 compression quality
   */
  async compressImage(
    uri: string,
    width?: number
  ): Promise<{ uri: string; width: number; height: number }> {
    const actions = [];
    if (width && width > APP_CONFIG.COMPRESSION_MAX_WIDTH) {
      actions.push({ resize: { width: APP_CONFIG.COMPRESSION_MAX_WIDTH } });
    } else if (!width) {
      // If width wasn't provided, apply resize action to ensure bounded max width
      actions.push({ resize: { width: APP_CONFIG.COMPRESSION_MAX_WIDTH } });
    }

    const result = await manipulateAsync(uri, actions, {
      compress: APP_CONFIG.COMPRESSION_QUALITY,
      format: SaveFormat.JPEG,
    });

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  },
};
