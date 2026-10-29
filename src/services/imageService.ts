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
  showPermissionAlert(type: 'camera' | 'photo library'): void {
    Alert.alert(
      'Permission Required',
      `Smart Capture needs access to your ${type} to attach pictures to your notes. Please enable it in Settings.`,
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
        quality: 1,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0 || !result.assets[0].uri) {
        return { canceled: true };
      }

      const asset = result.assets[0];
      return {
        canceled: false,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      };
    } catch {
      return {
        canceled: true,
        error: 'Unable to open camera.',
      };
    }
  },

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

      if (result.canceled || !result.assets || result.assets.length === 0 || !result.assets[0].uri) {
        return { canceled: true };
      }

      const asset = result.assets[0];
      return {
        canceled: false,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      };
    } catch {
      return {
        canceled: true,
        error: 'Unable to open photo library.',
      };
    }
  },

  async compressImage(
    uri: string,
    width?: number
  ): Promise<{ uri: string; width: number; height: number }> {
    const actions = [];
    if (width && width > APP_CONFIG.COMPRESSION_MAX_WIDTH) {
      actions.push({ resize: { width: APP_CONFIG.COMPRESSION_MAX_WIDTH } });
    } else if (!width) {
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
